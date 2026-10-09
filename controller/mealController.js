import { getMongoCollection } from "../config.js/database.js";
import { getRabbitMQChannel } from "../config.js/rabbitMQ.js";
import dotenv from "dotenv";
dotenv.config();



export const updateMealStatus = async (req, res) => {
    try {
        const mealCollection = getMongoCollection(process.env.MEAL_COLLECTION_NAME);
        const userCollection = getMongoCollection(process.env.USER_COLLECTION_NAME);
        const { mealType, status, userId } = req.body;

        if (!mealType || !status || !userId) {
            return res.status(400).json({ error: 'Meal type, status, and user ID are required' });
        }

        const user = await userCollection.findOne({ userId });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await mealCollection.updateOne(
            {
                userId,
                date: today
            },
            {
                $set: {
                    [`meals.${mealType}.status`]: status,
                    [`meals.${mealType}.updatedAt`]: new Date()
                },
                $setOnInsert: {
                    userId,
                    date: today,
                    createdAt: new Date()
                }
            },
            {
                upsert: true
            }
        );

        pushNotification(userId, mealType, status);

        res.json({ message: 'Meal status updated successfully' });
    } catch (error) {
        console.error('Error updating meal status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const pushNotification = async (userId, mealType, status) => {
    try {
        
        const userCollection = getMongoCollection(process.env.USER_COLLECTION_NAME);
        const familyCollection = getMongoCollection(process.env.COLLECTION_NAME);

        const user = await userCollection.findOne({ userId });
        const families = user ? user.familyIdList: [];
        const consumerIdList = new Set();

        console.log('Families:', families);

        for (const familyId of families) {
            const family = await familyCollection.findOne({ familyId: familyId });
            console.log('Family:', family);
            const familyMembers = family ? family.userIdList : [];
            consumerIdList.add(...familyMembers.filter(id => id !== userId));
        }

        const notifcation = {
            consumerIdList: Array.from(consumerIdList),
            message: `${user.name} has updated their ${mealType} status to ${status}.`,
            createdAt: new Date()
        }
        const channel = getRabbitMQChannel();
        await channel.publish(
            "notification.exchange",
            "notification.routingKey",
            Buffer.from(JSON.stringify(notifcation)),
            { persistent: true }
        );

        console.log('Notification pushed to RabbitMQ:', notifcation);

    } catch (error) {
        console.error('Error pushing notification:', error);
    }
}