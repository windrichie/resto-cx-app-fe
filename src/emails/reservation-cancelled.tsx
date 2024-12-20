import {
    Html,
    Head,
    Preview,
    Body,
    Container,
    Section,
    Text,
    Link,
} from "@react-email/components";

interface ReservationEmailProps {
    customerName: string;
    restaurantName: string;
    date: string;
    time: string;
    guests: number;
    address: string;
    restaurantSlug: string;
    restaurantThumbnail: string;
    baseUrl: string;
}

export default function ReservationCancelled({
    customerName,
    restaurantName,
    date,
    time,
    guests,
    address,
    restaurantSlug,
    restaurantThumbnail,
    baseUrl,
}: ReservationEmailProps) {
    return (
        <Html>
            <Head>
                <title>Reservation Cancelled</title>
            </Head>
            <Preview>Your reservation at {restaurantName} has been cancelled</Preview>
            <Body style={{ margin: '0', padding: '0', backgroundColor: '#f8f9fa' }}>
                <Container style={{ margin: '0 auto', padding: '20px 0 48px', maxWidth: '600px' }}>
                    <table style={{ width: '100%', borderSpacing: '0', borderCollapse: 'collapse', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <tr>
                            <td style={{ padding: '32px 48px 24px', textAlign: 'center', borderBottom: '1px solid #eaeaea' }}>
                                <Text style={{
                                    fontSize: '56px',
                                    margin: '0 0 24px',
                                    color: '#dc2626',
                                    lineHeight: '1'
                                }}>
                                    ✕
                                </Text>
                                <Text style={{ fontSize: '24px', fontWeight: '600', margin: '0' }}>
                                    Reservation cancelled
                                </Text>
                            </td>
                        </tr>

                        <tr>
                            <td style={{ padding: '32px 48px' }}>
                                <table style={{ width: '100%', borderSpacing: '0' }}>
                                    <tr>
                                        <td style={{ textAlign: 'center', paddingBottom: '24px' }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={restaurantThumbnail}
                                                alt={restaurantName}
                                                style={{
                                                    maxWidth: '400px',
                                                    width: '100%',
                                                    height: '200px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <Text style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 8px', color: '#1a1a1a' }}>
                                                {restaurantName}
                                            </Text>
                                            <Text style={{ fontSize: '15px', color: '#666666', margin: '0 0 32px' }}>
                                                {address}
                                            </Text>

                                            <Text style={{ fontSize: '16px', margin: '0 0 12px', color: '#333333' }}>
                                                Party of <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{guests}</span>
                                            </Text>
                                            <Text style={{ fontSize: '16px', margin: '0 0 12px', color: '#333333' }}>
                                                Name: <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{customerName}</span>
                                            </Text>
                                            <Text style={{ fontSize: '16px', margin: '0 0 32px', color: '#333333' }}>
                                                When: <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{date} · {time}</span>
                                            </Text>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style={{ textAlign: 'center', paddingTop: '8px' }}>
                                            <Link
                                                href={`${baseUrl}/${restaurantSlug}`}
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '12px 28px',
                                                    backgroundColor: '#0f172a',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '15px',
                                                    fontWeight: '500',
                                                    textDecoration: 'none',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                }}
                                            >
                                                Make a new reservation
                                            </Link>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </Container>
            </Body>
        </Html>
    );
}
