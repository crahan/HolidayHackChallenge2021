#include<stdio.h>
#include<stdlib.h>

    int main()
    {
    char ch;

    FILE *source, *target;

    char source_file[25] = "/var/spool/printer.log";
    char target_file[50] = "/app/lib/public/incoming/crahan_printer.log";

    source = fopen(source_file, "r");

        if( source == NULL )
        {
            printf("Press any key to exit...\n");
            exit(EXIT_FAILURE);
        }

    target = fopen(target_file, "w");

    if( target == NULL )
    {
        fclose(source);
        printf("Press any key to exit...\n");
        exit(EXIT_FAILURE);
    }

    while( ( ch = fgetc(source) ) != EOF )
        fputc(ch, target);

        fclose(source);
        fclose(target);

        return 0;
}
