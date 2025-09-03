'use client';

import { Github } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './button';

interface GitHubButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  repository: string; // Format: "owner/repo"
  children?: React.ReactNode;
}

interface GitHubRepoData {
  stargazers_count: number;
  html_url: string;
}

export const GitHubButton: React.FC<GitHubButtonProps> = ({
  className,
  size = 'md',
  variant = 'outline',
  repository,
  children = 'Star on GitHub',
}) => {
  const [starCount, setStarCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`https://api.github.com/repos/${repository}`);

        if (!response.ok) {
          if (response.status === 404) {
            console.log('Repository not found or private - hiding star count');
            setStarCount(null);
            return;
          }
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data: GitHubRepoData = await response.json();
        setStarCount(data.stargazers_count);
      } catch (err) {
        console.error('Failed to fetch GitHub star count:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch star count');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStarCount();
  }, [repository]);

  const handleClick = () => {
    window.open(`https://github.com/${repository}`, '_blank', 'noopener,noreferrer');
  };

  const formatStarCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Button
      onClick={handleClick}
      className={className}
      size={size}
      variant={variant}
      icon={<Github size={16} />}
    >
      {children}
      {!isLoading && !error && starCount !== null && (
        <span className="ml-1 text-xs opacity-80">{formatStarCount(starCount)}</span>
      )}
    </Button>
  );
};
