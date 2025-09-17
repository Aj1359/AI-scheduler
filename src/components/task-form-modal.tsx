import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  priority: z.enum(["critical", "high", "medium", "low"]),
  type: z.enum(["fixed", "flexible", "incomplete"]),
  targets: z.array(z.string()).min(1, "At least one target is required"),
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
  mode: "add" | "edit";
}

const priorityOptions = [
  { value: "critical", label: "Critical", color: "destructive" },
  { value: "high", label: "High", color: "destructive" },
  { value: "medium", label: "Medium", color: "secondary" },
  { value: "low", label: "Low", color: "outline" },
] as const;

const typeOptions = [
  { value: "fixed", label: "Fixed" },
  { value: "flexible", label: "Flexible" },
  { value: "incomplete", label: "Incomplete" },
] as const;

const targetSuggestions = [
  "attend_class",
  "academic_progress",
  "fitness",
  "health",
  "exam_prep",
  "skills_development",
  "portfolio",
  "personal_development",
  "work_project",
  "meeting",
  "research",
  "assignment",
];

export function TaskFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: TaskFormModalProps) {
  const [customTargets, setCustomTargets] = useState<string[]>(
    initialData?.targets || []
  );
  const [newTarget, setNewTarget] = useState("");

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: initialData?.name || "",
      startTime: initialData?.startTime || "",
      endTime: initialData?.endTime || "",
      priority: initialData?.priority || "medium",
      type: initialData?.type || "flexible",
      targets: initialData?.targets || [],
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = (data: TaskFormData) => {
    onSubmit({ ...data, targets: customTargets });
    form.reset();
    setCustomTargets([]);
    onOpenChange(false);
  };

  const addTarget = (target: string) => {
    if (target && !customTargets.includes(target)) {
      const updatedTargets = [...customTargets, target];
      setCustomTargets(updatedTargets);
      form.setValue("targets", updatedTargets);
    }
  };

  const removeTarget = (target: string) => {
    const updatedTargets = customTargets.filter((t) => t !== target);
    setCustomTargets(updatedTargets);
    form.setValue("targets", updatedTargets);
  };

  const addCustomTarget = () => {
    if (newTarget.trim()) {
      addTarget(newTarget.trim());
      setNewTarget("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new task and add it to your schedule."
              : "Modify the task details and update your schedule."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Math Class - Differential Equations"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Badge variant={option.color as any} className="text-xs">
                                {option.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormLabel>Targets</FormLabel>
              
              {/* Current targets */}
              {customTargets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customTargets.map((target) => (
                    <Badge
                      key={target}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {target}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-muted-foreground"
                        onClick={() => removeTarget(target)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Suggested targets */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Suggested targets:</p>
                <div className="flex flex-wrap gap-2">
                  {targetSuggestions
                    .filter((target) => !customTargets.includes(target))
                    .map((target) => (
                      <Badge
                        key={target}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => addTarget(target)}
                      >
                        + {target}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Custom target input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom target"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addCustomTarget()}
                />
                <Button type="button" variant="outline" onClick={addCustomTarget}>
                  Add
                </Button>
              </div>
              
              <FormMessage>{form.formState.errors.targets?.message}</FormMessage>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or details about this task..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === "add" ? "Add Task" : "Update Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}