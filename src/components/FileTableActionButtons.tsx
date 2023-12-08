import { FileTextIcon } from "lucide-react";
import Link from "next/link";
import FileDeleteButton from "./FileDeleteButton";
import { buttonVariants } from "./ui/button";

type Props = {};

const FileTableActionButtons = ({ fileId }: { fileId: string }) => {
  return (
    <div className="flex flex-row space-x-2">
      <Link
        href={`/dashboard/${fileId}`}
        className={buttonVariants({
          variant: "default",
          size: "sm",
          className: "mx-auto w-full",
        })}
      >
        <FileTextIcon className="h-4 w-4" />
      </Link>
      <FileDeleteButton fileId={fileId} />
    </div>
  );
};

export default FileTableActionButtons;
