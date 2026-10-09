// when user updates the meal status a notfication log should be added to notfication log cluster.
// The other user uses API to fetch their notications.

export const getMyNotifications = async (req, res) => {
    if (!req.body || !req.body.userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    const { userId } = req.body;

    try {
        const notificationCollection = getMongoCollection(process.env.NOTIFICATION_COLLECTION_NAME);

        const notifications = await notificationCollection
            .find({ consumerId: userId })
            .sort({ createdAt: -1 })
            .toArray();
            
        res.status(200).json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}