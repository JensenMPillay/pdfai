"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

import { trpc } from "@/app/_trpc/client";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { PLANS } from "@/config/stripe";
import { useUploadThing } from "@/lib/uploadthing";
import { Cloud, File, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Dropzone from "react-dropzone";

// DropZone
const UploadDropzone = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const router = useRouter();

  // Upload State
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { toast } = useToast();

  // Sync Back -> Front
  const { mutate: startPolling } = trpc.file.getFile.useMutation({
    onMutate: () => {
      return toast({
        title: "Setting up your file...",
        description: "You will be redirected automatically.",
        variant: "default",
      });
    },
    onSuccess: (file) => {
      // Go to
      router.push(`/dashboard/${file.id}`);
    },
    retry: true,
    retryDelay: 500,
    onError: () => {
      return toast({
        title: "Something went wrong...",
        description: "Please reload the page and try again.",
        variant: "destructive",
      });
    },
  });

  const { startUpload } = useUploadThing(
    isSubscribed ? "proPlanUploader" : "freePlanUploader",
    {
      onBeforeUploadBegin: (files) => {
        // Uploading
        setIsUploading(true);

        // Start Progress
        startSimulatedProgress();
        return files;
      },
      onClientUploadComplete: (res) => {
        // Destructuring From a Array (FileResponse[])
        const [fileResponse] = res;

        const key = fileResponse?.key;

        // Progress
        stopSimulatedProgress();
        setUploadProgress(100);

        // Sync UploadThing & TRPC
        return startPolling({ key });
      },
      onUploadError: (e) => {
        // Progres
        stopSimulatedProgress();
        setIsUploading(false);

        // Error
        return toast({
          title: "Something went wrong...",
          description:
            "Your file may be too large or not a valid PDF. Please upload an other file.",
          variant: "destructive",
        });
      },
    },
  );

  let interval: NodeJS.Timeout;

  // Function to Handle Simulated Progress
  const startSimulatedProgress = () => {
    setUploadProgress(0);

    // Interval for Progressing
    interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return prevProgress;
        }
        return prevProgress + 1;
      });
    }, 100);

    return interval;
  };

  const stopSimulatedProgress = () => {
    clearInterval(interval);
  };

  return (
    <Dropzone
      multiple={false}
      onDrop={async (acceptedFile) => {
        // Handle File Uploading
        await startUpload(acceptedFile);
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          {...getRootProps()}
          className="m-4 h-64 rounded-lg border border-dashed border-gray-300"
        >
          <div className="flex h-full w-full items-center justify-center">
            <label
              htmlFor="dropzone-file"
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <Cloud className="mb-2 h-6 w-6 text-zinc-500" />
                <p className="mb-2 text-sm text-zinc-700">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-zinc-500">
                  PDF (
                  {isSubscribed
                    ? PLANS.find((plan) => plan.name === "Pro")!.sizeLimit
                    : PLANS.find((plan) => plan.name === "Free")!.sizeLimit}
                  MB max)
                </p>
              </div>

              {acceptedFiles && acceptedFiles[0] ? (
                <div className="flex max-w-xs items-center divide-x divide-zinc-200 overflow-hidden rounded-md bg-white outline outline-[1px] outline-zinc-200">
                  <div className="grid h-full place-items-center px-3 py-2">
                    <File className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="h-full truncate px-3 py-2 text-sm">
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}

              {isUploading ? (
                <div className="mx-auto mt-4 w-full max-w-xs">
                  <Progress
                    indicatorColor={
                      uploadProgress === 100 ? "bg-green-500" : "bg-primary"
                    }
                    value={uploadProgress}
                    className="h-1 w-full bg-zinc-200"
                  />
                  {uploadProgress === 100 ? (
                    <div className="flex items-center justify-center gap-1 pt-2 text-center text-sm text-zinc-700">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Redirecting...
                    </div>
                  ) : null}
                </div>
              ) : null}

              <input
                {...getInputProps({
                  onClick: (e) => {
                    e.preventDefault();
                  },
                })}
                type="file"
                id="dropzone-file"
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </Dropzone>
  );
};

const FileUploadButton = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    // Modal
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v);
        }
      }}
    >
      {/* Modal Trigger  */}
      <DialogTrigger onClick={() => setIsOpen(true)} asChild>
        <Button>Upload PDF</Button>
      </DialogTrigger>
      {/* Modal Content  */}
      <DialogContent>
        <UploadDropzone isSubscribed={isSubscribed} />
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadButton;
