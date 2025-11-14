
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Mic,
  Image as ImageIcon,
  Plus,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoStatus } from "@/lib/types";
import Image from "next/image";

interface Video {
  id: string;
  title: string;
  description?: string;
  duration: number;
  actualDuration?: number;
  voiceType: "male" | "female";
  includeImages: boolean;
  status: VideoStatus;
  downloadUrl?: string;
  fileSize?: string;
  createdAt: string;
  completedAt?: string;
  script: {
    title: string;
    newsStory: {
      title: string;
      imageUrl?: string;
      topic: {
        name: string;
      };
    };
  };
}

interface VideoLibraryProps {
  onCreateNew: () => void;
}

export function VideoLibrary({ onCreateNew }: VideoLibraryProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/videos");
      if (!response.ok) throw new Error("Failed to fetch videos");
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Error",
        description: "Failed to load video library.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete video");
      
      setVideos(prev => prev.filter(v => v.id !== videoId));
      toast({
        title: "Video Deleted",
        description: "The video has been removed from your library.",
      });
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete video.",
        variant: "destructive",
      });
    }
  };

  const downloadVideo = async (video: Video) => {
    if (!video.downloadUrl) {
      toast({
        title: "Download Unavailable",
        description: "This video is not available for download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = video.downloadUrl;
      link.download = `${video.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your video download has begun.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download video.",
        variant: "destructive",
      });
    }
  };

  const previewVideo = (video: Video) => {
    if (video.downloadUrl) {
      window.open(video.downloadUrl, '_blank');
    }
  };

  const filteredAndSortedVideos = videos
    .filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          video.script.newsStory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          video.script.newsStory.topic.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || video.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "duration":
          return (b.actualDuration || b.duration) - (a.actualDuration || a.duration);
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (sizeString?: string) => {
    if (!sizeString) return "Unknown size";
    const bytes = parseInt(sizeString);
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: VideoStatus) => {
    switch (status) {
      case VideoStatus.COMPLETED:
        return "bg-green-100 text-green-800 border-green-200";
      case VideoStatus.PROCESSING:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case VideoStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case VideoStatus.ERROR:
        return "bg-red-100 text-red-800 border-red-200";
      case VideoStatus.EXPIRED:
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Video Library
            </h2>
            <p className="text-gray-600">
              Manage and download your created news videos.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={fetchVideos} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Video
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search videos by title, topic, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video Grid */}
      {filteredAndSortedVideos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Play className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter !== "all" ? "No Matching Videos" : "No Videos Yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filters." 
              : "Create your first news video to get started."
            }
          </p>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedVideos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base leading-tight mb-2">
                      {video.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(video.status)} border text-xs`}>
                        {video.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {video.script.newsStory.topic.name}
                      </span>
                    </div>
                  </div>
                  {video.script.newsStory.imageUrl && (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden ml-3 flex-shrink-0">
                      <Image
                        src={video.script.newsStory.imageUrl}
                        alt={video.title}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 line-clamp-2">
                  {video.script.newsStory.title}
                </div>

                {/* Video Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{formatDuration(video.actualDuration || video.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-gray-400" />
                    <span className="capitalize">{video.voiceType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    <span>{video.includeImages ? "With images" : "Text only"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>

                {video.fileSize && (
                  <div className="text-xs text-gray-500">
                    File size: {formatFileSize(video.fileSize)}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    {video.status === VideoStatus.COMPLETED && video.downloadUrl && (
                      <>
                        <Button
                          onClick={() => previewVideo(video)}
                          size="sm"
                          variant="outline"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => downloadVideo(video)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    onClick={() => deleteVideo(video.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
