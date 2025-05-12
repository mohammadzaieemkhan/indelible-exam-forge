
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogContent, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { IExam } from "@/components/ExamTabs";

interface DeleteExamDialogProps {
  open: boolean;
  examToDelete: IExam | null;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
}

const DeleteExamDialog = ({
  open,
  examToDelete,
  onOpenChange,
  onConfirmDelete,
}: DeleteExamDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Delete Exam</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this exam? This action cannot be undone.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteExamDialog;
