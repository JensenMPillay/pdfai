"use client";
import FileStatusBadge from "@/app/dashboard/components/FileStatusBadge";
import FileTableActionButtons from "@/app/dashboard/components/FileTableActionButtons";
import TableHeader from "@/components/table/TableHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { File } from "@/types/file";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export const fileColumns: ColumnDef<File>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: string | boolean) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: string | boolean) =>
          row.toggleSelected(!!value)
        }
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <TableHeader column={column} title="name" position="left" />;
    },
    enableColumnFilter: true,
    cell: ({ row }) => {
      return (
        <div className="text-left font-medium">{row.getValue("name")}</div>
      );
    },
  },
  {
    accessorKey: "uploadStatus",
    header: ({ column }) => {
      return <TableHeader column={column} title="status" position="center" />;
    },
    enableColumnFilter: true,
    cell: ({ row }) => {
      return <FileStatusBadge value={row.getValue("uploadStatus")} />;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return <TableHeader column={column} title="date" position="center" />;
    },
    enableColumnFilter: false,
    cell: ({ row }) => {
      const formattedCreatedAt = format(
        new Date(row.getValue("createdAt")),
        "dd MMM yyyy",
      );
      return (
        <div className="text-center font-medium">{formattedCreatedAt}</div>
      );
    },
  },
  {
    id: "actions",
    enableColumnFilter: false,
    cell: ({ row }) => {
      const file = row.original;
      return <FileTableActionButtons fileId={file.id} />;
    },
  },
];
