#!/usr/bin/env bash
for f in $(ls *.docx); do 
    match=$(exiftool $f | grep -i 'last modified by' | grep -iv 'santa')
    if [[ ! -z "$match" ]]; then 
        echo $f;
        echo $match;
    fi
done
