import { useAuth } from '../auth/AuthContext';
import TaskSummary from '../components/tasks/TaskSummary';
import TodayHabits from '../components/habits/TodayHabits';

function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{user?.name ? `${user.name}'s Dashboard` : 'Dashboard'}</h2>
        <p className="mt-2 text-muted">Your task overview and today’s routines.</p>
      </div>
      <TaskSummary />
      <TodayHabits />
    </div>
  );
}

export default Dashboard;
