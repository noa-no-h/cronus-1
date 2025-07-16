import { trpc } from '../utils/trpc';
import { AppLayout } from './AppLayout';

export function ActiveUserStatisticsPage() {
  const { data, isLoading, error } = trpc.statistics.getActiveUserCountToday.useQuery();

  if (isLoading) {
    return <AppLayout>Loading...</AppLayout>;
  }

  if (error) {
    return <AppLayout>Error: {error.message}</AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Active User Statistics</h1>
        <p>Number of active users today: {data?.count}</p>
      </div>
    </AppLayout>
  );
}
