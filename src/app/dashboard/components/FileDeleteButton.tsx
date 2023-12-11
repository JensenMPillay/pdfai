import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

const FileDeleteButton = ({ fileId }: { fileId: string }) => {
  // Track DeletingFile for Loading Status
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<
    string | null
  >(null);

  //   To Invalidate Data
  const utils = trpc.useUtils();

  // Delete File
  const { mutate: deleteFile } = trpc.file.deleteFile.useMutation({
    // Invalidate list of files to reload page
    onSuccess: () => {
      utils.user.getUserFiles.invalidate();
    },
    // on Mutation Change
    onMutate({ id }) {
      setCurrentlyDeletingFile(id);
    },
    // on Mutation End
    onSettled() {
      setCurrentlyDeletingFile(null);
    },
  });
  return (
    <Button
      onClick={() => deleteFile({ id: fileId })}
      size="sm"
      className="mx-auto w-full"
      variant="destructive"
    >
      {currentlyDeletingFile === fileId ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
};

export default FileDeleteButton;
