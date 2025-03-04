import mongoose, { Model, Document } from 'mongoose';

export async function deleteOldDocuments<T>(model: Model<T>): Promise<void> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await model.deleteMany({ date: { $lt: oneWeekAgo } });

    console.log(`Deleted ${result.deletedCount} documents older than one week.`);
  } catch (error) {
    console.error("Error deleting old documents:", error);
  }
}