import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LaptopIcon, RocketIcon } from '@radix-ui/react-icons';

const DownloadPage = () => {
  const arm64Url = 'https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-arm64.dmg';
  const x64Url = 'https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-x64.dmg';

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Download for macOS</h1>
        <p className="text-muted-foreground mt-2">
          Choose the right version for your Mac's processor.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <RocketIcon className="w-8 h-8" />
              <div>
                <CardTitle>Apple Silicon</CardTitle>
                <CardDescription>For Macs with M1, M2, M3 chips and newer.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow">
            <p className="text-sm text-muted-foreground mb-4">
              Most Macs from late 2020 onwards use Apple Silicon. This version is optimized for the
              best performance and efficiency.
            </p>
            <Button asChild className="w-full mt-auto">
              <a href={arm64Url}>Download for Apple Silicon</a>
            </Button>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <LaptopIcon className="w-8 h-8" />
              <div>
                <CardTitle>Intel</CardTitle>
                <CardDescription>For Macs with Intel processors.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow">
            <p className="text-sm text-muted-foreground mb-4">
              For Mac models from before late 2020. You can check by going to Apple Menu &gt; About
              This Mac.
            </p>
            <Button asChild className="w-full mt-auto">
              <a href={x64Url}>Download for Intel</a>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="text-center mt-12 text-sm text-muted-foreground">
        <p>By downloading, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
};

export default DownloadPage;
