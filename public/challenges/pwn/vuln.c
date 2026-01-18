/*
 * Vulnerable Program - Buffer Overflow 101
 * 
 * This program has a classic buffer overflow vulnerability.
 * Can you exploit it to call the secret_function?
 *
 * Compile: gcc -fno-stack-protector -z execstack -no-pie -o vuln vuln.c
 * 
 * Flag: ctf{smashing_the_stack_for_fun}
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// This function should never be called directly
void secret_function() {
    printf("\n[+] Congratulations! You called the secret function!\n");
    printf("[+] Flag: ctf{smashing_the_stack_for_fun}\n");
    exit(0);
}

void vulnerable_function() {
    char buffer[64];  // Small buffer - easy to overflow
    
    printf("Enter your name: ");
    gets(buffer);  // VULNERABLE: no bounds checking!
    
    printf("Hello, %s!\n", buffer);
}

int main(int argc, char *argv[]) {
    printf("=== Welcome to the Vulnerable Program ===\n");
    printf("Address of secret_function: %p\n", secret_function);
    printf("\n");
    
    vulnerable_function();
    
    printf("\nGoodbye!\n");
    return 0;
}
