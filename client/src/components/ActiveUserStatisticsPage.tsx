import { AppLayout } from './AppLayout';
import { trpc } from '../utils/trpc';
import { Button } from './ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';

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

  const {
    data: signupsGrowthData,
    isLoading: signupsGrowthLoading,
    error: signupsGrowthError,
  } = trpc.statistics.getSignupsGrowthChart.useQuery();

  const {
    data: activeWindowEventsData,
    isLoading: activeWindowEventsLoading,
    error: activeWindowEventsError,
  } = trpc.statistics.getActiveWindowEventsChart.useQuery();

  const {
    data: kpisData,
    isLoading: kpisLoading,
    error: kpisError,
  } = trpc.statistics.getKPIs.useQuery();

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

  if (
    todayLoading ||
    yesterdayLoading ||
    lastWeekLoading ||
    signupsGrowthLoading ||
    activeWindowEventsLoading ||
    kpisLoading
  ) {
    return <AppLayout>Loading...</AppLayout>;
  }

  if (
    todayError ||
    yesterdayError ||
    lastWeekError ||
    signupsGrowthError ||
    activeWindowEventsError ||
    kpisError
  ) {
    const error =
      todayError ||
      yesterdayError ||
      lastWeekError ||
      signupsGrowthError ||
      activeWindowEventsError ||
      kpisError;
    return <AppLayout>Error: {error?.message}</AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-4 space-y-8">
        <h1 className="text-3xl font-bold mb-6">Active User Statistics Dashboard</h1>

        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg bg-blue-50">
            <h3 className="text-sm font-medium text-blue-600">Signups This Week</h3>
            <p className="text-2xl font-bold text-blue-900">{kpisData?.signupsThisWeek}</p>
          </div>
          <div className="p-4 border rounded-lg bg-green-50">
            <h3 className="text-sm font-medium text-green-600">Active Users This Week</h3>
            <p className="text-2xl font-bold text-green-900">{kpisData?.activeUsersThisWeek}</p>
          </div>
          <div className="p-4 border rounded-lg bg-purple-50">
            <h3 className="text-sm font-medium text-purple-600">Signups to Active Ratio</h3>
            <p className="text-2xl font-bold text-purple-900">{kpisData?.signupsToActiveRatio}</p>
          </div>
          <div className="p-4 border rounded-lg bg-orange-50">
            <h3 className="text-sm font-medium text-orange-600">Ratio This Week</h3>
            <p className="text-2xl font-bold text-orange-900">
              {kpisData?.signupsToActiveRatioThisWeek}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signups Growth Chart */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Signups Growth (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={signupsGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')} />
                <Line
                  type="monotone"
                  dataKey="signups"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Active Window Events Chart */}
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Activity Events Per Day (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activeWindowEventsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')} />
                <Bar dataKey="events" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Existing Active Users Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Active Users Data</h2>

          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Today</h3>
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
            <h3 className="text-lg font-semibold mb-2">Yesterday</h3>
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
            <h3 className="text-lg font-semibold mb-2">Last 7 Days</h3>
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
