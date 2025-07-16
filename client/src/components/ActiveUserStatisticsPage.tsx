import { AppLayout } from './AppLayout';
import { trpc } from '../utils/trpc';
import { Button } from './ui/button';

export function ActiveUserStatisticsPage() {
  const {
    data: todayData,
    isLoading: todayLoading,
    error: todayError,
  } = trpc.statistics.getActiveUserCountToday.useQuery();
  const {
    data: yesterdayData,
    isLoading: yesterdayLoading,
    error: yesterdayError,
  } = trpc.statistics.getActiveUserCountYesterday.useQuery();
  const {
    data: lastWeekData,
    isLoading: lastWeekLoading,
    error: lastWeekError,
  } = trpc.statistics.getActiveUserCountLastWeek.useQuery();

  const { refetch: getActiveUsersToday, isFetching: isFetchingToday } =
    trpc.statistics.getActiveUsersToday.useQuery(undefined, {
      enabled: false,
    });

  const { refetch: getActiveUsersYesterday, isFetching: isFetchingYesterday } =
    trpc.statistics.getActiveUsersYesterday.useQuery(undefined, {
      enabled: false,
    });

  const { refetch: getActiveUsersLastWeek, isFetching: isFetchingLastWeek } =
    trpc.statistics.getActiveUsersLastWeek.useQuery(undefined, {
      enabled: false,
    });

  const handleDownload = async (refetchFunction: any, filename: string, isFetching: boolean) => {
    if (isFetching) return;

    try {
      const { data: users } = await refetchFunction();
      if (!users) {
        console.error('Could not fetch users for CSV download');
        return;
      }

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        ['Email', 'First Name', 'Name'].join(',') +
        '\n' +
        users
          .map((u: any) => {
            const firstName = u.name?.split(' ')[0] || '';
            return [u.email, firstName, u.name]
              .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
              .join(',');
          })
          .join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download CSV', error);
    }
  };

  if (todayLoading || yesterdayLoading || lastWeekLoading) {
    return <AppLayout>Loading...</AppLayout>;
  }

  if (todayError || yesterdayError || lastWeekError) {
    const error = todayError || yesterdayError || lastWeekError;
    return <AppLayout>Error: {error?.message}</AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Active User Statistics</h1>

        <div className="space-y-6">
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Today</h2>
            <p className="mb-4">Number of active users today: {todayData?.count}</p>
            <Button
              onClick={() =>
                handleDownload(getActiveUsersToday, 'active_users_today.csv', isFetchingToday)
              }
              disabled={isFetchingToday}
            >
              {isFetchingToday ? 'Downloading...' : 'Download CSV'}
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Yesterday</h2>
            <p className="mb-4">Number of active users yesterday: {yesterdayData?.count}</p>
            <Button
              onClick={() =>
                handleDownload(
                  getActiveUsersYesterday,
                  'active_users_yesterday.csv',
                  isFetchingYesterday
                )
              }
              disabled={isFetchingYesterday}
            >
              {isFetchingYesterday ? 'Downloading...' : 'Download CSV'}
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Last 7 Days</h2>
            <p className="mb-4">Number of active users in the last 7 days: {lastWeekData?.count}</p>
            <Button
              onClick={() =>
                handleDownload(
                  getActiveUsersLastWeek,
                  'active_users_last_week.csv',
                  isFetchingLastWeek
                )
              }
              disabled={isFetchingLastWeek}
            >
              {isFetchingLastWeek ? 'Downloading...' : 'Download CSV'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
