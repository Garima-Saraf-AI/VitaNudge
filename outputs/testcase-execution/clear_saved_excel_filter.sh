#!/bin/sh
set -eu

source_file="/Users/uditgupta/Documents/TestCase_VitaNudge_Updated.xlsx"
work_dir="$(mktemp -d /private/tmp/vitanudge-xlsx.XXXXXX)"
rebuilt_file="/private/tmp/TestCase_VitaNudge_Updated_unfiltered.xlsx"

unzip -q "$source_file" -d "$work_dir"
perl -0pi -e 's#<x:autoFilter\b[^>]*>.*?</x:autoFilter>##s; s#name="Column1"#name="Testing date"#g' "$work_dir/xl/tables/table1.xml"
perl -0pi -e 's# hidden="1"##g' "$work_dir/xl/worksheets/sheet2.xml"

(
  cd "$work_dir"
  zip -qr "$rebuilt_file" .
)

cp "$rebuilt_file" "$source_file"
printf '%s\n' "$source_file"
