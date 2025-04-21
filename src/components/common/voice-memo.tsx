"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Mic, Square, Play, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export type Recording = {
  id: string
  url: string
  transcript: string
  keyPoints: string[]
  timestamp: string
}

interface VoiceMemoProps {
  onComplete: (recording: Recording) => void
  recordings: Recording[]
  onDeleteRecording: (id: string) => void
}

export function VoiceMemo({ onComplete, recordings, onDeleteRecording }: VoiceMemoProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioURL, setAudioURL] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    audioChunksRef.current = []
    setAudioURL("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        // Update recording time
      }, 1000)
    } catch (err) {
      console.error("Error accessing microphone:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Stop all audio tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }
  }

  const processAudio = () => {
    setIsProcessing(true)

    // In a real app, we would send the audio to a transcription service
    // For demo purposes, we'll simulate this with a timeout and mock data
    setTimeout(() => {
      if (audioURL) {
        const mockTranscript =
          "Met Alex at the tech conference. They're interested in our product and want to discuss potential partnerships. Follow up with them next week about the demo."
        const mockKeyPoints = [
          "Interested in AI applications",
          "Looking for partnerships in fintech",
          "Previously worked at Google",
        ]

        const newRecording: Recording = {
          id: Date.now().toString(),
          url: audioURL,
          transcript: mockTranscript,
          keyPoints: mockKeyPoints,
          timestamp: new Date().toLocaleTimeString(),
        }

        onComplete(newRecording)
        setAudioURL("")
        setIsProcessing(false)
      }
    }, 1500)
  }

  const cancelRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL)
      setAudioURL("")
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()

        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
        }
      }

      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
    }
  }, [audioURL])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-zinc-50 p-3">
        {isRecording ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                <span className="text-xs font-medium">Recording</span>
              </div>
              <span className="text-xs">{formatTime(0)}</span>
            </div>
            <Progress value={0} className="h-1" />
          </div>
        ) : audioURL ? (
          <audio src={audioURL} controls className="w-full h-8" />
        ) : (
          <div className="flex h-12 flex-col items-center justify-center">
            <Mic className="h-5 w-5 text-zinc-400" />
            <p className="mt-1 text-xs text-zinc-500">Ready to record</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {isRecording ? (
          <Button onClick={stopRecording} variant="destructive" size="sm" className="w-full">
            <Square className="mr-2 h-3 w-3" />
            Stop
          </Button>
        ) : audioURL ? (
          <>
            <Button onClick={processAudio} size="sm" className="flex-1" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-3 w-3" />
                  Save
                </>
              )}
            </Button>
            <Button onClick={cancelRecording} size="sm" variant="outline">
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={startRecording} size="sm" className="w-full">
            <Mic className="mr-2 h-3 w-3" />
            Record
          </Button>
        )}
      </div>

      {recordings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Saved Recordings</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recordings.map((recording) => (
              <Card key={recording.id} className="bg-zinc-50">
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <audio src={recording.url} controls className="w-full h-6" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-500 hover:text-red-500"
                      onClick={() => onDeleteRecording(recording.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
