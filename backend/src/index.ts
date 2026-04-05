import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const PLAN_LIMITS: Record<string, { properties: number; tenants: number }> = {
  FREE: { properties: 1, tenants: 5 },
  AARAMBH: { properties: 1, tenants: 5 },
  VISTAR: { properties: 2, tenants: 10 },
  PRAGATI: { properties: 5, tenants: 30 },
  ANANT: { properties: 999999, tenants: 999999 },
};

// Auth Middleware Stub (For demo purposes, accept user id in header)
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    (req as any).userId = userId;
  }
  next();
});

// User routes
app.post('/api/users', async (req, res) => {
  const { firebaseUid, email, name, role, phone, imageUrl } = req.body;
  
  // Standardize phone for comparison (remove spaces, dashes, etc.)
  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : null;
  const cleanEmail = email ? email.toLowerCase() : null;

  try {
    // 1. Primary: Check if user already exists by firebaseUid
    let user = await prisma.user.findUnique({ where: { firebaseUid } });
    
    // 2. Fallback: If not found by UID, check by EMAIL (helps with project migrations)
    if (!user && cleanEmail) {
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (user) {
        user = await prisma.user.update({ 
          where: { id: user.id }, 
          data: { firebaseUid } 
        });
      }
    }

    // 3. Fallback: Check for pre-created profiles (caretakers/tenants) by phone or email
    if (!user && (cleanPhone || cleanEmail)) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            cleanPhone ? { phone: { contains: cleanPhone.slice(-10) } } : { id: '___' },
            cleanEmail ? { email: cleanEmail ?? '___' } : { id: '___' }
          ],
          firebaseUid: { startsWith: 'caretaker_' } // Logic for invited users
        }
      });

      if (user) {
        // If the landlord gave a specific name, keep it unless we have a new valid one
        const updatedName = (name && name !== 'User') ? name : user.name;
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            firebaseUid, 
            name: updatedName, 
            phone: cleanPhone || user.phone 
          }
        });
      }
    }

    // 4. Create new user if still not found
    if (!user) {
      const uniqueEmail = cleanEmail || `${firebaseUid}@phone.kiraya.pro`;
      user = await prisma.user.create({
        data: { 
          firebaseUid, 
          email: uniqueEmail, 
          name: name || 'User', 
          role: (role as any) || 'TENANT', 
          phone: cleanPhone,
          imageUrl: imageUrl || null
        }
      });
    }

    // 5. CRITICAL: Link to existing 'Tenant' profile if not already linked
    if (user.role === 'TENANT') {
      const existingProfile = await prisma.tenant.findUnique({ where: { userId: user.id } });
      if (!existingProfile) {
        const profileToLink = await prisma.tenant.findFirst({
          where: { 
            OR: [
              cleanPhone ? { phone: { contains: cleanPhone.slice(-10) } } : { id: '___' },
              cleanEmail ? { email: cleanEmail ?? '___' } : { id: '___' }
            ],
            userId: null 
          }
        });
        if (profileToLink) {
          await prisma.tenant.update({ where: { id: profileToLink.id }, data: { userId: user.id } });
        }
      }
    }

    // Standard updates for existing accounts
    const updates: any = {};
    if ((!user.name || user.name === 'User') && name && name !== 'User') updates.name = name;
    if (!user.phone && cleanPhone) updates.phone = cleanPhone;
    if (!user.imageUrl && imageUrl) updates.imageUrl = imageUrl;

    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({ where: { id: user.id }, data: updates });
    }

    res.json(user);
    console.log('--- LOGIN SUCCESS ---', { id: user.id, role: user.role, name: user.name });
  } catch (error: any) {
    console.error('--- SMART LINKING ERROR ---', error.message || error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'This account is already linked to another user.' });
    }
    res.status(400).json({ error: error.message || 'Failed to process login and identify account' });
  }
});

app.get('/api/users/me', async (req, res) => {
  const firebaseUid = req.headers['x-firebase-uid'] as string;
  if (!firebaseUid) return res.status(401).send();
  const user = await prisma.user.findUnique({ 
    where: { firebaseUid }, 
    include: { 
      assignments: true,
      tenantProfile: true
    } 
  });
  res.json(user);
});

// Properties
app.get('/api/properties', async (req, res) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { tenantProfile: true } });
  if (!user) return res.status(401).send();

  let query: any = {};
  if (user.role === 'LANDLORD') {
    query.landlordId = userId;
  } else if (user.role === 'CARETAKER') {
    const assignments = await prisma.caretakerAssignment.findMany({ where: { caretakerId: userId }});
    query.id = { in: assignments.map(a => a.propertyId) };
  } else if (user.role === 'TENANT') {
    if (!user.tenantProfile) return res.json([]);
    query.id = user.tenantProfile.propertyId;
  }
  const properties = await prisma.property.findMany({ where: query, include: { tenants: true } });
  res.json(properties);
});

app.post('/api/properties', async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== 'LANDLORD') {
    return res.status(403).json({ error: 'Only landlords can create properties' });
  }

  // Check Limits
  const plan = user.subscriptionPlan || 'FREE';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const currentProperties = await prisma.property.count({ where: { landlordId: userId } });

  if (currentProperties >= limits.properties) {
    return res.status(403).json({ 
      error: `Limit reached: Your ${plan} plan only allows ${limits.properties} property. Please upgrade to add more.` 
    });
  }
  
  const { name, address, units, imageUrl } = req.body;
  console.log('--- ADDING PROPERTY ---', { name, address, units, imageUrl, userId });

  try {
    const property = await prisma.property.create({
      data: { 
        name, 
        address, 
        units: isNaN(parseInt(units)) ? 1 : parseInt(units), 
        imageUrl, 
        landlordId: userId 
      }
    });
    res.json(property);
  } catch (err: any) {
    console.error('Property creation error detailed:', err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user?.role !== 'LANDLORD') {
    return res.status(403).json({ error: 'Only landlords can delete properties' });
  }

  try {
    const propertyId = req.params.id;
    
    // Verify ownership
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || property.landlordId !== userId) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    // Delete associated records first
    await prisma.caretakerAssignment.deleteMany({ where: { propertyId } });
    await prisma.rentRecord.deleteMany({ where: { propertyId } });
    await prisma.complaint.deleteMany({ where: { propertyId } });
    
    // For tenants, we need to clear their reminders first
    const propertyTenants = await prisma.tenant.findMany({ where: { propertyId } });
    const tenantIds = propertyTenants.map(t => t.id);
    await prisma.reminder.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await prisma.tenantDocument.deleteMany({ where: { tenantId: { in: tenantIds } } });
    
    await prisma.tenant.deleteMany({ where: { propertyId } });
    
    // Finally delete the property
    await prisma.property.delete({ where: { id: propertyId } });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete Property Error:', error);
    res.status(400).json({ error: 'Failed to delete property' });
  }
});

// Caretakers
app.get('/api/caretakers', async (req, res) => {
  const userId = (req as any).userId;
  const caretakers = await prisma.user.findMany({
    where: { role: 'CARETAKER', landlordId: userId },
    include: {
      assignments: {
        include: { property: { select: { name: true } } }
      }
    }
  });
  res.json(caretakers);
});

app.post('/api/caretakers', async (req, res) => {
  const { name, phone, email, propertyIds, imageUrl } = req.body;
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user?.role !== 'LANDLORD') {
    return res.status(403).json({ error: 'Only landlords can add caretakers' });
  }

  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : null;
  const cleanEmail = email ? email.toLowerCase() : null;

  try {
    // 1. Check if user already exists
    let caretaker = await prisma.user.findFirst({
      where: {
        OR: [
          cleanPhone ? { phone: cleanPhone } : { id: '___' },
          cleanEmail ? { email: cleanEmail } : { id: '___' }
        ]
      }
    });

    if (caretaker) {
      // 2. Update existing user to Caretaker role + Link to landlord
      caretaker = await prisma.user.update({
        where: { id: caretaker.id },
        data: {
          role: 'CARETAKER',
          landlordId: userId,
          name: name, // Force update to Landlord's given name
          imageUrl: imageUrl || (caretaker as any).imageUrl,
          assignments: {
            deleteMany: {}, // Clear past assignments
            create: (propertyIds || []).map((pid: string) => ({
              propertyId: pid
            }))
          }
        }
      });
    } else {
      // 3. Create fresh placeholder user if not found
      caretaker = await prisma.user.create({
        data: {
          firebaseUid: `caretaker_${Date.now()}`,
          name,
          phone: cleanPhone || phone,
          email: cleanEmail || email || `${Date.now()}@kiraya.staff`,
          role: 'CARETAKER',
          landlordId: userId,
          imageUrl,
          assignments: {
            create: (propertyIds || []).map((pid: string) => ({
              propertyId: pid
            }))
          }
        }
      });
    }
    res.json(caretaker);
  } catch (err: any) {
    console.error('Add Caretaker Error:', err);
    res.status(400).json({ error: `Cannot add caretaker: ${err.message}` });
  }
});

app.delete('/api/caretakers/:id', async (req, res) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user?.role !== 'LANDLORD') {
    return res.status(403).json({ error: 'Only landlords can remove caretakers' });
  }

  try {
    const caretakerId = req.params.id;
    // 1. Remove assignments
    await prisma.caretakerAssignment.deleteMany({ where: { caretakerId } });
    // 2. Remove link from any Tenants that might be using this user account
    await prisma.tenant.updateMany({ where: { userId: caretakerId }, data: { userId: null } });
    // 3. Reassign any activities (Complaints/Notices) this caretaker "owned" back to the landlord
    await prisma.complaint.updateMany({ where: { landlordId: caretakerId }, data: { landlordId: userId } });
    await prisma.notice.updateMany({ where: { landlordId: caretakerId }, data: { landlordId: userId } });
    // 4. Remove any landlord links that reference this user (i.e. if THEY were a landlord of someone - unlikely for caretakers)
    await prisma.user.updateMany({ where: { landlordId: caretakerId }, data: { landlordId: null } });
    // 5. Delete the user
    await prisma.user.delete({ where: { id: caretakerId } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Delete Caretaker Error:', err);
    res.status(400).json({ error: `Could not remove: ${err.message}` });
  }
});

// Tenants
app.get('/api/tenants', async (req, res) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { tenantProfile: true }});
  if (!user) return res.status(401).send();
  
  let query: any = {};
  if (user.role === 'LANDLORD') {
    query.landlordId = userId;
  } else if (user.role === 'CARETAKER') {
    const assignments = await prisma.caretakerAssignment.findMany({ where: { caretakerId: userId }});
    query.propertyId = { in: assignments.map(a => a.propertyId) };
  } else if (user.role === 'TENANT') {
    if (!user.tenantProfile) return res.json([]);
    query.id = user.tenantProfile.id;
  }
  const tenants = await prisma.tenant.findMany({ where: query, include: { property: true } });
  res.json(tenants);
});

// Rent Records
app.get('/api/rent-records', async (req, res) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { tenantProfile: true } 
  });
  if (!user) return res.status(401).send();

  let query: any = {};
  if (user.role === 'LANDLORD') {
    query.property = { landlordId: userId };
  } else if (user.role === 'TENANT') {
    if (!user.tenantProfile) return res.json([]);
    query.tenantId = user.tenantProfile.id;
  } else if (user.role === 'CARETAKER') {
    const assignments = await prisma.caretakerAssignment.findMany({ where: { caretakerId: userId }});
    query.propertyId = { in: assignments.map(a => a.propertyId) };
  }

  const records = await prisma.rentRecord.findMany({ 
    where: query, 
    orderBy: { createdAt: 'desc' },
    include: { tenant: true, property: true }
  });
  res.json(records);
});

app.post('/api/tenants', async (req, res) => {
  const { name, phone, email, rentAmount, deposit, leaseStart, propertyId, hometown, idProofUrl, rentDay, roomNumber } = req.body;
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) return res.status(401).send();
  
  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : null;
  const cleanEmail = email ? email.toLowerCase() : null;

  // Use user's own ID if landlord, or their associated landlord ID if caretaker
  const landlordId = user.role === 'LANDLORD' ? userId : user.landlordId;
  
  if (!landlordId) {
    return res.status(403).json({ error: 'Associated landlord not found for this profile' });
  }

  // Check Limits (always check against the landlord's plan)
  const actualLandlord = await prisma.user.findUnique({ where: { id: landlordId } });
  const plan = actualLandlord?.subscriptionPlan || 'FREE';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const currentTenants = await prisma.tenant.count({ where: { landlordId } });

  if (currentTenants >= limits.tenants) {
    return res.status(403).json({ 
      error: `Limit reached: The landlord's ${plan} plan only allows ${limits.tenants} tenants. Please upgrade to add more.` 
    });
  }

  const tenant = await prisma.tenant.create({
    data: { 
      name, 
      phone: cleanPhone || phone, 
      email: cleanEmail || email || null,
      rentAmount: parseFloat(String(rentAmount || 0)), 
      deposit: parseFloat(String(deposit || 0)), 
      leaseStart: leaseStart ? new Date(leaseStart) : new Date(), 
      propertyId, 
      landlordId, 
      hometown: hometown || null, 
      idProofUrl: idProofUrl || null, 
      rentDay: parseInt(String(rentDay || 1)), 
      roomNumber: roomNumber || null
    }
  });
  res.json(tenant);
});

app.put('/api/tenants/:id', async (req, res) => {
  const { rentStatus, isActive, idProofUrl, hometown, name, phone, email, roomNumber, rentAmount, rentDay } = req.body;
  const oldTenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  
  const tenant = await prisma.tenant.update({
    where: { id: req.params.id },
    data: { 
      rentStatus, 
      isActive, 
      idProofUrl, 
      hometown, 
      name, 
      phone, 
      email, 
      roomNumber, 
      rentAmount: rentAmount !== undefined ? Number(rentAmount) : undefined,
      rentDay: rentDay !== undefined ? Number(rentDay) : undefined
    }
  });

  // If newly marked as PAID, create a record
  if (rentStatus === 'PAID' && oldTenant?.rentStatus !== 'PAID') {
    await prisma.rentRecord.create({
      data: {
        tenantId: tenant.id,
        propertyId: tenant.propertyId,
        amount: tenant.rentAmount || 0,
        status: 'PAID',
        month: new Date(),
        paidDate: new Date()
      }
    });
  }

  res.json(tenant);
});

// Complaints
app.get('/api/complaints', async (req, res) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { tenantProfile: true } });
  let query: any = {};
  if (user?.role === 'LANDLORD') {
    query.landlordId = userId;
  } else if (user?.role === 'CARETAKER') {
    const assignments = await prisma.caretakerAssignment.findMany({ where: { caretakerId: userId }});
    query.propertyId = { in: assignments.map(a => a.propertyId) };
  } else if (user?.role === 'TENANT') {
    if (!user.tenantProfile) return res.json([]);
    query.tenantId = user.tenantProfile.id;
  }
  const complaints = await prisma.complaint.findMany({ where: query, include: { property: true, tenant: true } });
  res.json(complaints);
});

app.post('/api/complaints', async (req, res) => {
  const { propertyId, tenantId, title, description, imageUrl } = req.body;
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { tenantProfile: true } });
  
  let finalLandlordId;
  let finalPropertyId = propertyId;
  let finalTenantId = tenantId;

  if (user?.role === 'TENANT' && user.tenantProfile) {
    finalLandlordId = user.tenantProfile.landlordId;
    finalPropertyId = user.tenantProfile.propertyId;
    finalTenantId = user.tenantProfile.id;
  } else if (user?.role === 'CARETAKER') {
    finalLandlordId = user.landlordId;
  } else {
    finalLandlordId = userId;
  }

  const complaint = await prisma.complaint.create({
    data: { 
      landlordId: finalLandlordId, 
      propertyId: finalPropertyId, 
      tenantId: finalTenantId, 
      title, 
      description,
      imageUrl
    }
  });
  res.json(complaint);
});

app.put('/api/complaints/:id', async (req, res) => {
  const { status, notes } = req.body;
  const complaint = await prisma.complaint.update({
    where: { id: req.params.id },
    data: { status, notes }
  });
  res.json(complaint);
});

// Notices
app.get('/api/notices', async (req, res) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).send();

  let notices;
  if (user.role === 'LANDLORD') {
    notices = await prisma.notice.findMany({
      where: { landlordId: userId },
      orderBy: { createdAt: 'desc' },
      include: { landlord: { select: { name: true } } }
    });
  } else {
    const tenant = await prisma.tenant.findFirst({ where: { userId } });
    const landlordId = user.landlordId || tenant?.landlordId || userId;
    
    notices = await prisma.notice.findMany({
      where: { landlordId },
      orderBy: { createdAt: 'desc' },
      include: { landlord: { select: { name: true } } }
    });
  }
  res.json(notices);
});

app.post('/api/notices', async (req, res) => {
  const { title, body, priority } = req.body;
  const notice = await prisma.notice.create({
    data: { title, body, priority: priority || 'NORMAL', landlordId: (req as any).userId }
  });
  res.json(notice);
});

app.delete('/api/notices/:id', async (req, res) => {
  await prisma.notice.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.delete('/api/tenants/:id', async (req, res) => {
  try {
    const tenantId = req.params.id;
    // Delete associated records first (Prisma should handle cascade if configured, but safe to check)
    await prisma.rentRecord.deleteMany({ where: { tenantId } });
    await prisma.complaint.deleteMany({ where: { tenantId } });
    await prisma.reminder.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete Tenant Error:', error);
    res.status(400).json({ error: 'Failed to delete tenant' });
  }
});

// Payments
app.post('/api/payments/create-order', async (req, res) => {
  const { amount, plan } = req.body;
  const options = {
    amount: amount * 100, // amount in the smallest currency unit (paise)
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    notes: { plan }
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/api/payments/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, status } = req.body;
  const userId = (req as any).userId;

  if (status === 'free') {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan: plan,
          subscriptionExpiry: null // Free plan doesn't expire usually
        }
      });
      return res.json({ status: 'ok' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');

  if (digest === razorpay_signature) {
    // Payment verified
    try {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year subscription

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan: plan,
          subscriptionExpiry: expiryDate
        }
      });
      res.json({ status: 'ok' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  } else {
    res.status(400).json({ status: 'verification_failed' });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
