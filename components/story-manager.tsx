"use client"

import { useState, memo, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, CheckCircle2, ChevronRight } from "lucide-react"

const StoryItem = memo(({ story, currentStoryId, isAdmin, onSelectStory, onDeleteStory }: { story: any, currentStoryId: string, isAdmin: boolean, onSelectStory: (id: string) => void, onDeleteStory: (id: string) => void }) => {
  const isActive = story.id === currentStoryId

  const renderResult = () => {
    const r = story?.result
    if (r && typeof r === 'object' && Object.keys(r).length > 0) {
      const parts = []
      if (r.QA !== undefined && r.QA !== null && r.QA !== "") parts.push(`QA: ${r.QA}`)
      if (r.DEV !== undefined && r.DEV !== null && r.DEV !== "") parts.push(`DEV: ${r.DEV}`)
      return parts.join(' | ')
    }
    return 'Sin resultados'
  }

  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${isActive
        ? "bg-primary/10 border-primary shadow-md"
        : "bg-muted border-transparent hover:border-border hover:shadow-sm"
        }`}
      onClick={() => isAdmin && !isActive && onSelectStory(story.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
            <h4 className={`font-medium text-sm truncate ${isActive ? "text-primary" : ""}`}>{story.title}</h4>
            {story.voted && <CheckCircle2 className="w-4 h-4 text-accent" />}
          </div>
          {story.description && <p className="text-xs text-muted-foreground line-clamp-2">{story.description}</p>}
          {story.voted && (
            <p className="text-xs text-accent font-medium mt-1">Resultado: {renderResult()}</p>
          )}
        </div>
        <div className="flex gap-1">
          {isAdmin && !isActive && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onSelectStory(story.id)
              }}
              size="sm"
              className="h-8 px-3 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all hover:shadow-sm font-medium cursor-pointer"
            >
              Seleccionar
            </Button>
          )}
          {isAdmin && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteStory(story.id)
              }}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
})

StoryItem.displayName = "StoryItem"

function StoryManager({ room, isAdmin, onAddStory, onDeleteStory, onSelectStory }: { room: any, isAdmin: boolean, onAddStory: (title: string, description: string) => void, onDeleteStory: (id: string) => void, onSelectStory: (id: string) => void }) {
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")

  const handleCreate = async () => {
    if (!newTitle.trim()) return

    await onAddStory(newTitle, newDescription)
    setNewTitle("")
    setNewDescription("")
    setIsCreating(false)
  }

  const stories = useMemo(() => {
    const allStories = room?.stories || [];

    return allStories.filter((s: any) => !s.voted);
  }, [room?.stories]);
  const currentStoryId = useMemo(() => room?.currentStory?.id, [room?.currentStory?.id]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historias de Usuario</CardTitle>
        {isAdmin && !isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all hover:shadow-md hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Historia
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isCreating && (
          <div className="mb-4 p-4 bg-card border border-border rounded-lg space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Título</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: Implementar login de usuario"
                className="bg-muted border-border text-foreground"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descripción (opcional)</label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Como usuario, quiero..."
                className="bg-muted border-border text-foreground min-h-20"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all hover:shadow-md hover:scale-105 cursor-pointer"
              >
                Crear
              </Button>
              <Button
                onClick={() => {
                  setIsCreating(false)
                  setNewTitle("")
                  setNewDescription("")
                }}
                size="sm"
                variant="outline"
                className="border-border hover:bg-muted bg-transparent font-medium transition-all cursor-pointer"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {stories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay historias creadas</p>
            {isAdmin && <p className="text-sm mt-2">Crea una historia para comenzar</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {stories.map((story: any) => (
              <StoryItem
                key={story.id}
                story={story}
                currentStoryId={currentStoryId}
                isAdmin={isAdmin}
                onSelectStory={onSelectStory}
                onDeleteStory={onDeleteStory}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(StoryManager)
