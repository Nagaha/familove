import amqp from 'amqplib';

let channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);

    channel = await connection.createChannel();

    await channel.assertExchange(
          "notification.exchange",
          "direct",
          { durable: true }
    );

    await channel.assertQueue("notification.queue", { durable: true });

    await channel.bindQueue(
        "notification.queue",
        "notification.exchange",
        "notification.routingKey"
    );

    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
}

export const getRabbitMQChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel is not initialized. Call connectRabbitMQ first.');
  } 
    return channel;
}