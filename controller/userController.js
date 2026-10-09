import { getMongoCollection } from '../config.js/database.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

export const createUser = async (req, res) => {
    try {
        const collection = getMongoCollection(process.env.USER_COLLECTION_NAME);

        if (!req || !req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'Request body is missing or empty' });
        }

        const newUser = {
            userId: uuidv4() + req.body.name.split(' ').join('').trim(),
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const result = await collection.insertOne(newUser);

        res.status(201).json({ message: 'User created successfully', userId: newUser.userId });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addUserToFamily = async (req, res) => {
    try {
        const userCollection = getMongoCollection(process.env.USER_COLLECTION_NAME);
        const familyCollection = getMongoCollection(process.env.COLLECTION_NAME);

        const { userId, familyId } = req.body;

        if (!userId || !familyId) {
            return res.status(400).json({ error: 'User ID and Family ID are required' });
        }

        const user = await userCollection.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const family = await familyCollection.findOne({ familyId });
        if (!family) {
            return res.status(404).json({ error: 'Family not found' });
        }

        await userCollection.updateOne(
            { userId },
            { $set: { familyIdList: [...(user.familyIdList || []), familyId], updatedAt: new Date() } }
        );

        await familyCollection.updateOne(
            { familyId },
            { $set: { userIdList: [...(family.userIdList || []), userId], updatedAt: new Date() } }
        );  

        res.status(200).json({ message: 'User added to family successfully' });
    } catch (error) {
        console.error('Error adding user to family:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const joinFamilyByCode = async (req, res) => {
    try {
        const userCollection = getMongoCollection(process.env.USER_COLLECTION_NAME);
        const familyCollection = getMongoCollection(process.env.COLLECTION_NAME);

        const { userId, familyCode } = req.body;

        if (!userId || !familyCode) {
            return res.status(400).json({ error: 'User ID and Family Code are required' });
        }

        if (!/^\d{6}$/.test(familyCode)) {
            return res.status(400).json({ error: 'Family code must be exactly 6 digits' });
        }

        const user = await userCollection.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const family = await familyCollection.findOne({ familyCode });
        if (!family) {
            return res.status(404).json({ error: 'Family not found with this code' });
        }

        if ((user.familyIdList || []).includes(family.familyId)) {
            return res.status(409).json({ error: 'User is already a member of this family' });
        }

        await userCollection.updateOne(
            { userId },
            { $set: { familyIdList: [...(user.familyIdList || []), family.familyId], updatedAt: new Date() } }
        );

        await familyCollection.updateOne(
            { familyCode },
            { $set: { userIdList: [...(family.userIdList || []), userId], updatedAt: new Date() } }
        );

        res.status(200).json({ message: 'Successfully joined family', familyId: family.familyId, familyName: family.name });
    } catch (error) {
        console.error('Error joining family by code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const userCollection = getMongoCollection(process.env.USER_COLLECTION_NAME);
        const userList = await userCollection.find().toArray();
        res.status(200).json({ data: userList });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }   
};
