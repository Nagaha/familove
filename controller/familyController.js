import { getMongoCollection } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const generateFamilyCode = async (familyCollection) => {
    let code;
    let exists = true;
    while (exists) {
        code = String(Math.floor(100000 + Math.random() * 900000));
        const existing = await familyCollection.findOne({ familyCode: code });
        exists = !!existing;
    }
    return code;
};

export const createFamily = async (req, res) => {
    try {
        const familyCollection = getMongoCollection(process.env.COLLECTION_NAME);
        let newFamily = {};

        if (!req || !req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'Request body is missing or empty' });
        }

        newFamily.name = req.body.name || '';
        newFamily.familyId = uuidv4() + newFamily.name;
        newFamily.familyCode = await generateFamilyCode(familyCollection);
        newFamily.userIdList = [];
        newFamily.createdAt = new Date();
        newFamily.updatedAt = new Date();

        const result = await familyCollection.insertOne(newFamily);

        res.status(201).json({ message: 'Family created successfully', data: newFamily.familyId });

    } catch (error) {
        console.error('Error creating family:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllFamily = async (req, res) => {
    try {
        const familyCollection = getMongoCollection(process.env.COLLECTION_NAME);
        const familyList = await familyCollection.find().toArray();
        res.status(200).json({ data: familyList });
    } catch (error) {
        console.error('Error fetching families:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyFamily = async (req, res) => {
    try {
        const familyCollection = getMongoCollection(process.env.COLLECTION_NAME);
        const userCollection = getMongoCollection(process.env.USER_COLLECTION_NAME);
        const mealCollection = getMongoCollection(process.env.MEAL_COLLECTION_NAME);

        const { familyId, familyCode } = req.body;

        if (!familyId && !familyCode) {
            return res.status(400).json({
                error: "Family ID or Family Code is required"
            });
        }


        // Fetch family by familyId or familyCode
        const query = familyId ? { familyId } : { familyCode };
        const family = await familyCollection.findOne(query);

        if (!family) {
            return res.status(404).json({
                error: "Family not found"
            });
        }


        // Fetch all family members
        const members = await userCollection
            .find({
                userId: {
                    $in: family.userIdList
                }
            })
            .toArray();


        // Normalize today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);


        // Fetch today's meal records
        const meals = await mealCollection
            .find({
                userId: {
                    $in: family.userIdList
                },
                date: today
            })
            .toArray();


        // Convert meal array → map
        const mealMap = {};

        meals.forEach(meal => {
            mealMap[meal.userId] = meal.meals;
        });


        const defaultMeals = {
            BREAKFAST: {
                status: "PENDING"
            },
            LUNCH: {
                status: "PENDING"
            },
            DINNER: {
                status: "PENDING"
            }
        };


        // Combine users + meals
        const membersWithMeals = members.map(member => {

            const existingMeals = mealMap[member.userId] || {};

            return {
                userId: member.userId,
                name: member.name,

                meals: {
                    ...defaultMeals,
                    ...existingMeals
                }
            };
        });


        return res.status(200).json({
            data: {
                familyId: family.familyId,
                familyCode: family.familyCode,
                familyName: family.name,
                members: membersWithMeals
            }
        });


    } catch (error) {
        console.error("Error fetching family:", error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
};