export const calculateNextWatering = (from: Date, frequencyDays: number): Date => {
   const next = new Date(from);
   next.setDate(next.getDate() + (frequencyDays || 7));
   return next;
};
