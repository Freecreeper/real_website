def main():
    try:
        from py_vapid import Vapid
    except ImportError as error:
        raise SystemExit("Install requirements first: pip install -r requirements.txt") from error

    vapid = Vapid()
    vapid.generate_keys()
    print("Add these to your Flask environment:")
    print(f"VAPID_PUBLIC_KEY={vapid.public_key}")
    print(f"VAPID_PRIVATE_KEY={vapid.private_key}")
    print("VAPID_SUBJECT=mailto:admin@pressthebutton.click")


if __name__ == "__main__":
    main()
