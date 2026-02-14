import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

async function fetchAllPlaylistVideos(playlistId: string): Promise<any[]> {
  let videos: any[] = []
  let nextPageToken: string | undefined = undefined

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      console.error('YouTube API error:', data.error)
      break
    }

    if (data.items) {
      videos = videos.concat(data.items)
    }

    nextPageToken = data.nextPageToken
  } while (nextPageToken)

  return videos
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const inputUrl = searchParams.get('url')

  if (!inputUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
  }

  try {
    let playlistId: string | null = null
    let channelId: string | null = null
    let channelTitle = ''
    let isPlaylist = false

    // Check if it's a playlist URL
    if (inputUrl.includes('playlist?list=') || inputUrl.includes('&list=')) {
      const match = inputUrl.match(/[?&]list=([^&]+)/)
      if (match) {
        playlistId = match[1]
        isPlaylist = true

        // Get playlist info
        const playlistResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`
        )
        const playlistData = await playlistResponse.json()

        if (playlistData.items && playlistData.items.length > 0) {
          channelTitle = playlistData.items[0].snippet.title
        }
      }
    }

    // If not a playlist, treat as channel URL
    if (!playlistId) {
      let channelUsername = ''

      if (inputUrl.includes('/channel/')) {
        channelId = inputUrl.split('/channel/')[1].split('/')[0].split('?')[0]
      } else if (inputUrl.includes('/@')) {
        channelUsername = inputUrl.split('/@')[1].split('/')[0].split('?')[0]
      } else if (inputUrl.includes('/c/')) {
        channelUsername = inputUrl.split('/c/')[1].split('/')[0].split('?')[0]
      } else if (inputUrl.includes('/user/')) {
        channelUsername = inputUrl.split('/user/')[1].split('/')[0].split('?')[0]
      }

      // If we have username/handle, get channel ID
      if (channelUsername && !channelId) {
        // Try by handle first
        const handleResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&forHandle=${channelUsername}&key=${YOUTUBE_API_KEY}`
        )
        const handleData = await handleResponse.json()

        if (handleData.items && handleData.items.length > 0) {
          channelId = handleData.items[0].id
          channelTitle = handleData.items[0].snippet.title
          playlistId = handleData.items[0].contentDetails.relatedPlaylists.uploads
        } else {
          // Try search as fallback
          const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${channelUsername}&key=${YOUTUBE_API_KEY}`
          )
          const searchData = await searchResponse.json()

          if (searchData.items && searchData.items.length > 0) {
            channelId = searchData.items[0].snippet.channelId
          }
        }
      }

      // Get channel details and uploads playlist
      if (channelId && !playlistId) {
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
        )
        const channelData = await channelResponse.json()

        if (channelData.items && channelData.items.length > 0) {
          playlistId = channelData.items[0].contentDetails.relatedPlaylists.uploads
          channelTitle = channelData.items[0].snippet.title
        }
      }
    }

    if (!playlistId) {
      return NextResponse.json({ error: 'Kanál nebo playlist nenalezen' }, { status: 404 })
    }

    // Fetch all videos from playlist
    const videoItems = await fetchAllPlaylistVideos(playlistId)

    if (!videoItems || videoItems.length === 0) {
      return NextResponse.json({ error: 'Žádná videa nenalezena' }, { status: 404 })
    }

    const videos = videoItems.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      publishedAt: item.snippet.publishedAt,
    }))

    return NextResponse.json({
      channelTitle: isPlaylist ? `Playlist: ${channelTitle}` : channelTitle,
      channelId: channelId || playlistId,
      videoCount: videos.length,
      videos,
    })
  } catch (error) {
    console.error('YouTube API error:', error)
    return NextResponse.json({ error: 'Chyba při načítání videí' }, { status: 500 })
  }
}
