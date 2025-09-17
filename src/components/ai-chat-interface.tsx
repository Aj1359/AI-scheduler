import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Mic, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

interface AiChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage?: (message: string) => void;
  onVoiceInput?: () => void;
  isProcessing?: boolean;
  className?: string;
}

export function AiChatInterface({
  messages,
  onSendMessage,
  onVoiceInput,
  isProcessing = false,
  className
}: AiChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleSend = () => {
    if (input.trim() && onSendMessage) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    onVoiceInput?.();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "agent": return <Bot className="h-4 w-4 text-primary" />;
      case "user": return <User className="h-4 w-4 text-accent" />;
      default: return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn("flex flex-col h-96", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Scheduling Agent</h3>
          <Badge variant="secondary" className="text-xs">
            {isProcessing ? "Processing..." : "Ready"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Chat with your intelligent scheduling assistant
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className="shrink-0 mt-1">
                {getMessageIcon(message.type)}
              </div>
              
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3 text-sm",
                  message.type === "user" 
                    ? "bg-primary text-primary-foreground ml-4" 
                    : "bg-muted mr-4",
                  message.type === "system" && "bg-accent/10 border border-accent/20"
                )}
              >
                <p>{message.content}</p>
                
                {message.actions && message.actions.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {message.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant="secondary"
                        size="sm"
                        onClick={action.action}
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
                
                <div className={cn(
                  "flex items-center gap-1 mt-2 text-xs",
                  message.type === "user" 
                    ? "text-primary-foreground/70" 
                    : "text-muted-foreground"
                )}>
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(message.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-3">
              <Bot className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div className="bg-muted rounded-lg p-3 mr-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-200" />
                  </div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          {messages.length === 0 && !isProcessing && (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium mb-1">Welcome to your AI Scheduling Agent</p>
              <p className="text-sm">Ask me to generate your schedule, add tasks, or make changes!</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge variant="outline" className="text-xs">
                  "Make my schedule for today"
                </Badge>
                <Badge variant="outline" className="text-xs">
                  "Add gym at 6pm"
                </Badge>
                <Badge variant="outline" className="text-xs">
                  "Reschedule my study session"
                </Badge>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Ask your AI agent anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={isProcessing}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleVoiceInput}
            disabled={isProcessing}
            className={cn(
              isListening && "bg-primary text-primary-foreground animate-pulse-glow"
            )}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}