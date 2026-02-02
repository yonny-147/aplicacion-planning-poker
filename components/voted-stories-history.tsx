"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Calendar } from "lucide-react"

export default function VotedStoriesHistory({ room }: { room: any }) {
    const votedStories = useMemo(() => {
        const allStories = room?.stories || [];
        return allStories
            .filter((s: any) => s.voted)
            .sort((a: any, b: any) => (b.votedAt || 0) - (a.votedAt || 0)); // Más recientes primero
    }, [room?.stories]);

    const renderResult = (story: any) => {
        const r = story?.result;
        if (r && typeof r === 'object' && Object.keys(r).length > 0) {
            const parts = [];
            if (r.QA !== undefined && r.QA !== null && r.QA !== "") parts.push(`QA: ${r.QA}`);
            if (r.DEV !== undefined && r.DEV !== null && r.DEV !== "") parts.push(`DEV: ${r.DEV}`);
            return parts.join(' | ');
        }
        return 'Sin resultados';
    };

    const formatDate = (timestamp: number) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (votedStories.length === 0) {
        return (
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        Historial de Votaciones
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No hay historias votadas aún</p>
                        <p className="text-sm mt-2">Las historias completadas aparecerán aquí</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Historial de Votaciones ({votedStories.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {votedStories.map((story: any) => (
                        <div
                            key={story.id}
                            className="p-4 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                                        <h4 className="font-medium text-sm">{story.title}</h4>
                                    </div>
                                    {story.description && (
                                        <p className="text-xs text-muted-foreground mb-2">{story.description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(story.votedAt)}</span>
                                </div>

                                <div className="p-3 bg-background rounded-md">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Resultados:</p>
                                    <p className="text-sm font-semibold text-primary">{renderResult(story)}</p>
                                </div>

                                {story.votes && story.votes.length > 0 && (
                                    <div className="pt-2 border-t border-border">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Votos individuales:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {story.votes.map((vote: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between text-xs p-2 bg-background rounded"
                                                >
                                                    <span className="text-muted-foreground truncate">
                                                        {vote.participantName}
                                                        {vote.role && ` (${vote.role})`}
                                                    </span>
                                                    <span className="font-bold text-foreground ml-2">
                                                        {vote.vote === "coffee" ? "☕" : vote.vote}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
