import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const channelUrl = searchParams.get('url')

  if (!channelUrl) {
    return NextResponse.json({ error: 'Channel URL is required' }, { status: 400 })
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
  }

  try {
    // Extract channel ID or username from URL
    let channelId = ''
    let channelUsername = ''

    if (channelUrl.includes('/channel/')) {
      channelId = channelUrl.split('/channel/')[1].split('/')[0].split('?')[0]
    } else if (channelUrl.includes('/@')) {
      channelUsername = channelUrl.split('/@')[1].split('/')[0].split('?')[0]
    } else if (channelUrl.includes('/c/')) {
      channelUsername = channelUrl.split('/c/')[1].split('/')[0].split('?')[0]
    } else if (channelUrl.includes('/user/')) {
      channelUsername = channelUrl.split('/user/')[1].split('/')[0].split('?')[0]
    }

    // If we have username, get channel ID first
    if (channelUsername && !channelId) {
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${channelUsername}&key=${YOUTUBE_API_KEY}`
      )
      const searchData = await searchResponse.json()

      if (searchData.items && searchData.items.length > 0) {
        channelId = searchData.items[0].snippet.channelId
      }
    }

    if (!channelId) {
      // Try to get channel by handle
      const handleResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&forHandle=${channelUsername}&key=${YOUTUBE_API_KEY}`
      )
      const handleData = await handleResponse.json()

      if (handleData.items && handleData.items.length > 0) {
        channelId = handleData.items[0].id
      }
    }

    if (!channelId) {
      return NextResponse.json({ error: 'Could not find channel' }, { status: 404 })
    }

    // Get channel's uploads playlist
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
    )
    const channelData = await channelResponse.json()

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads
    const channelTitle = channelData.items[0].snippet.title

    // Get videos from uploads playlist
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
    )
    const videosData = await videosResponse.json()

    if (!videosData.items) {
      return NextResponse.json({ error: 'No videos found' }, { status: 404 })
    }

    const videos = videosData.items.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      publishedAt: item.snippet.publishedAt,
    }))

    return NextResponse.json({
      channelTitle,
      channelId,
      videos,
    })
  } catch (error) {
    console.error('YouTube API error:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
