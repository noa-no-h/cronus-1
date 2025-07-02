import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../utils/trpc'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'

export const MultiPurposeAppsSettings = () => {
  const { token } = useAuth()
  const [apps, setApps] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { data: initialApps, isLoading: isFetching } = trpc.user.getMultiPurposeApps.useQuery(
    { token: token || '' },
    { enabled: !!token }
  )

  const updateAppsMutation = trpc.user.updateMultiPurposeApps.useMutation()

  useEffect(() => {
    if (initialApps) {
      setApps(initialApps)
      setIsLoading(false)
    }
  }, [initialApps])

  const handleUpdate = (updatedApps: string[]) => {
    const validApps = updatedApps.map((s) => s.trim()).filter(Boolean)
    setApps(validApps)
    if (token) {
      updateAppsMutation.mutate({ token, apps: validApps })
    }
  }

  const handleAppChange = (index: number, value: string) => {
    const newApps = [...apps]
    newApps[index] = value
    setApps(newApps)
  }

  const handleAddNew = () => {
    setApps([...apps, ''])
  }

  const handleRemove = (index: number) => {
    const newApps = apps.filter((_, i) => i !== index)
    handleUpdate(newApps)
  }

  if (isLoading || isFetching) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-1/2 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Purpose Apps</CardTitle>
        <CardDescription>
          Apps listed here will always be re-evaluated by the AI instead of using your past history.
          Add apps that you use for both work and personal tasks (e.g., Messages, WhatsApp, Notion).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apps.map((app, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={app}
                onChange={(e) => handleAppChange(index, e.target.value)}
                onBlur={() => handleUpdate(apps)}
                placeholder="Enter app name (e.g., Notion)"
              />
              <Button variant="ghost" size="icon" onClick={() => handleRemove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button onClick={handleAddNew} variant="outline">
            Add New App
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
