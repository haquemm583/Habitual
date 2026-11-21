export function validMilestoneAssignment(id) {
  return id === undefined || id === null || (Number.isInteger(id) && id > 0 && id <= 2147483647);
}

export function sendMilestoneAssignmentError(error, res, next) {
  if (error.code === '23503' &&
      ['tasks_milestone_id_user_id_fkey', 'recurring_habits_milestone_owner_fkey'].includes(error.constraint)) {
    return res.status(400).json({ error: 'Choose a milestone from your account.' });
  }
  return next(error);
}
