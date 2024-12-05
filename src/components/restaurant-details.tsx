import Image from 'next/image'

export default function RestaurantDetails() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Magpie by Burgertory</h2>
      <Image
        src="https://lh3.googleusercontent.com/p/AF1QipMmNGS2qESSh9ZojYdx3uaK_dYbwBQOM8QIJRTj=s680-w680-h510?height=300&width=400"
        // src="/placeholder.svg?height=300&width=400"
        alt="Restaurant"
        width={400}
        height={300}
        className="rounded-lg mb-4"
      />
      <p className="text-gray-600 mb-2">123 Culinary Street, Foodville, FC 12345</p>
      <p className="mb-4">Experience exquisite flavors in a cozy atmosphere.</p>
      <h3 className="font-semibold mb-2">Operating Hours:</h3>
      <ul className="list-disc list-inside text-gray-600 mb-4">
        <li>Monday - Friday: 11:00 AM - 10:00 PM</li>
        <li>Saturday - Sunday: 10:00 AM - 11:00 PM</li>
      </ul>
      <p className="text-sm text-gray-500">
        We look forward to serving you with our delectable dishes and warm hospitality. 
        For any special arrangements or large group bookings, please contact us directly.
      </p>
    </div>
  )
}