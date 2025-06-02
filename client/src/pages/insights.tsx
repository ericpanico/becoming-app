import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Heart, Compass } from 'lucide-react';
import { storage } from '@/lib/storage';
import { JournalEntry, IdentitySummary } from '@shared/schema';

export default function Insights() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [identitySummary, setIdentitySummary] = useState<IdentitySummary | null>(null);

  useEffect(() => {
    const loadedEntries = storage.getEntries();
    const loadedIdentity = storage.getIdentitySummary();
    
    setEntries(loadedEntries);
    setIdentitySummary(loadedIdentity);
  }, []);

  const getEmotionalInsights = () => {
    if (entries.length === 0) return [];

    const emotionCounts: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.emotionalTone) {
        emotionCounts[entry.emotionalTone] = (emotionCounts[entry.emotionalTone] || 0) + 1;
      }
    });

    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getThemeInsights = () => {
    if (entries.length === 0) return [];

    const themeCounts: Record<string, number> = {};
    entries.forEach(entry => {
      entry.themes.forEach(theme => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    });

    return Object.entries(themeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);
  };

  const getActivityInsights = () => {
    if (entries.length === 0) return { streak: 0, averagePerWeek: 0, mostActiveDay: 'N/A' };

    const entryDates = entries.map(e => new Date(e.timestamp).toDateString());
    const uniqueDays = [...new Set(entryDates)];
    
    // Calculate current streak
    let streak = 0;
    const today = new Date().toDateString();
    const sortedDates = uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (sortedDates[0] === today || sortedDates[0] === new Date(Date.now() - 86400000).toDateString()) {
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date(Date.now() - i * 86400000).toDateString();
        if (sortedDates[i] === expectedDate) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Day of week analysis
    const dayOfWeekCounts: Record<string, number> = {};
    entries.forEach(entry => {
      const dayOfWeek = new Date(entry.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    });

    const mostActiveDay = Object.entries(dayOfWeekCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    const averagePerWeek = entries.length / Math.max(1, uniqueDays.length / 7);

    return { streak, averagePerWeek: Math.round(averagePerWeek * 10) / 10, mostActiveDay };
  };

  const getRecentInsights = () => {
    return entries
      .filter(entry => entry.aiInsight)
      .slice(0, 3)
      .map(entry => ({
        insight: entry.aiInsight!,
        date: entry.timestamp,
        themes: entry.themes
      }));
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(timestamp));
  };

  const emotionalInsights = getEmotionalInsights();
  const themeInsights = getThemeInsights();
  const activityInsights = getActivityInsights();
  const recentInsights = getRecentInsights();

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Insights</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {entries.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-neutral-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No Insights Yet</h3>
                  <p className="text-neutral-600">
                    Complete some journal entries to see patterns and insights about your journey.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Activity Overview */}
            <Card className="bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900">Activity Patterns</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-neutral-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-semibold text-neutral-900 mb-1">
                        {activityInsights.streak}
                      </div>
                      <div className="text-xs text-neutral-500">Day Streak</div>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-semibold text-neutral-900 mb-1">
                        {activityInsights.averagePerWeek}
                      </div>
                      <div className="text-xs text-neutral-500">Per Week</div>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3 text-center">
                      <div className="text-sm font-semibold text-neutral-900 mb-1">
                        {activityInsights.mostActiveDay.slice(0, 3)}
                      </div>
                      <div className="text-xs text-neutral-500">Active Day</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emotional Patterns */}
            {emotionalInsights.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-accent" />
                      </div>
                      <h3 className="text-lg font-medium text-neutral-900">Emotional Patterns</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {emotionalInsights.map(([emotion, count], index) => (
                        <div key={emotion} className="flex items-center justify-between">
                          <span className="text-neutral-700 capitalize">{emotion}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-neutral-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-accent to-primary h-2 rounded-full"
                                style={{ 
                                  width: `${(count / emotionalInsights[0][1]) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-neutral-500 w-6">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Theme Analysis */}
            {themeInsights.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                        <Compass className="w-4 h-4 text-secondary" />
                      </div>
                      <h3 className="text-lg font-medium text-neutral-900">Key Themes</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {themeInsights.map(([theme, count], index) => (
                        <Badge 
                          key={theme}
                          variant="secondary" 
                          className={`${
                            index < 3 
                              ? 'bg-primary/10 text-primary'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {theme} ({count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent AI Insights */}
            {recentInsights.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-neutral-900">Recent AI Insights</h3>
                    
                    <div className="space-y-4">
                      {recentInsights.map((insight, index) => (
                        <div 
                          key={index}
                          className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 rounded-lg p-4 space-y-2"
                        >
                          <p className="text-neutral-700 leading-relaxed text-sm">
                            {insight.insight}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {insight.themes.slice(0, 2).map((theme, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {theme}
                                </Badge>
                              ))}
                            </div>
                            <span className="text-xs text-neutral-500">
                              {formatDate(insight.date)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Identity Summary */}
            {identitySummary && (
              <Card className="bg-white shadow-sm">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-neutral-900">Current Identity Summary</h3>
                    
                    <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4">
                      <p className="text-neutral-700 leading-relaxed text-sm">
                        {identitySummary.summary}
                      </p>
                    </div>
                    
                    <div className="text-xs text-neutral-500">
                      Last updated {new Date(identitySummary.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
