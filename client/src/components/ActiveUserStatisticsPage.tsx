import { trpc } from '../utils/trpc';
import { AppLayout } from './AppLayout';
import { Button } from './ui/button';

export function ActiveUserStatisticsPage() {
  const { data, isLoading, error } = trpc.statistics.getActiveUserCountToday.useQuery();
  const { refetch: getActiveUsers, isFetching } = trpc.statistics.getActiveUsersToday.useQuery(
    undefined,
    {
      enabled: false,
    }
  );

  const handleDownload = async () => {
    try {
      const { data: users } = await getActiveUsers();
      if (!users) {
        console.error('Could not fetch users for CSV download');
        // Optionally show an error to the user
        return;
      }

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        ['Email', 'First Name', 'Name'].join(',') +
        '\n' +
        users
          .map((u) => {
            const firstName = u.name?.split(' ')[0] || '';
            return [u.email, firstName, u.name]
              .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
              .join(',');
          })
          .join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'active_users.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download CSV', error);
      // You might want to show a toast or notification to the user
    }
  };

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
        <Button onClick={handleDownload} disabled={isFetching} className="mt-4">
          {isFetching ? 'Downloading...' : 'Download CSV'}
        </Button>
      </div>
    </AppLayout>
  );
}
