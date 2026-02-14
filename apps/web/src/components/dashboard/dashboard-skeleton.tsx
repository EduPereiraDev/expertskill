'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-9 w-64 bg-zinc-800 rounded" />
        <div className="h-5 w-48 bg-zinc-800 rounded mt-2" />
      </div>

      {/* Quick Stats Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-zinc-800 rounded" />
              <div className="h-8 w-32 bg-zinc-800 rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-40 bg-zinc-800 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Summary Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-zinc-800 rounded" />
          <div className="h-4 w-64 bg-zinc-800 rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-4 rounded-lg bg-zinc-800/50">
                <div className="h-8 w-16 bg-zinc-700 rounded mx-auto" />
                <div className="h-3 w-20 bg-zinc-700 rounded mx-auto mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="h-5 w-48 bg-zinc-800 rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-zinc-800 rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="h-5 w-32 bg-zinc-800 rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-zinc-800 rounded" />
          </CardContent>
        </Card>
      </div>

      {/* Feed Skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 w-56 bg-zinc-800 rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-zinc-700 rounded-full" />
                  <div>
                    <div className="h-4 w-32 bg-zinc-700 rounded" />
                    <div className="h-3 w-24 bg-zinc-700 rounded mt-1" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 bg-zinc-700 rounded" />
                  <div className="h-3 w-16 bg-zinc-700 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
