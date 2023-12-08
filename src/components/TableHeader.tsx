import { cn } from "@/lib/utils";
import { File } from "@/types/file";
import { Column } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";

const TableHeader = ({
  column,
  title,
  position,
}: {
  column: Column<File>;
  title: string;
  position: string;
}) => {
  return (
    <div className="flex w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className={cn("w-full capitalize", {
          "justify-start pl-0": position === "left",
          "justify-center": position === "center",
          "justify-end pr-0": position === "right",
        })}
      >
        {title}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default TableHeader;
