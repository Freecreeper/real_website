import base64


def base64url(value):
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def main():
    try:
        from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
        from py_vapid import Vapid
    except ImportError as error:
        raise SystemExit("Install requirements first: pip install -r requirements.txt") from error

    vapid = Vapid()
    vapid.generate_keys()

    public_key = vapid.public_key.public_bytes(
        Encoding.X962,
        PublicFormat.UncompressedPoint,
    )
    private_key = vapid.private_pem().decode("utf-8").replace("\n", "\\n")

    print("Add these to your Flask environment or .env:")
    print("VAPID_PUBLIC_KEY=" + base64url(public_key))
    print("VAPID_PRIVATE_KEY=" + private_key)
    print("VAPID_SUBJECT=mailto:admin@pressthebutton.click")


if __name__ == "__main__":
    main()
