const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.unit.deleteMany();
  console.log('All existing units deleted.');
  const unitPromises = [];

  // 유닛 타입과 판매 유형 배열
  const types = ['Condominium', 'TownHouse', 'House', 'Apartment'];
  const sellTypes = ['Rent', 'Sale'];
  const admins = [1, 2, 3]; // 어드민 아이디 배열
  const furnitureOptions = [
    { label: "Any", value: "none" },
    { label: "Fully Furnished", value: "fully" },
    { label: "Semi-Furnished", value: "semi" },
    { label: "Unfurnished", value: "unfurnished" },
  ];
  const petPolicyOption = [
    { label: "Any", value: "none" },
    { label: "Allow", value: "Allow" },
    { label: "Small Only", value: "Small Only" },
    { label: "Not allowed", value: "Not allowed" },
  ];
  // 샘플 주소 및 이미지
  const addresses = [
    {
      address2: "Taguig",
      address3: "Bonifacio Global City",
      address4: "The Fort, Unit 2203",
      latitude: 14.5519,
      longitude: 121.0512,
      images: [
        "https://example.com/condo2-1.jpg",
        "https://example.com/condo2-2.jpg",
        "https://example.com/condo2-3.jpg",
        "https://example.com/condo2-4.jpg",
        "https://example.com/condo2-5.jpg",
      ],
    },
    {
      address2: "Makati",
      address3: "Salcedo Village",
      address4: "Unit 1507",
      latitude: 14.5635,
      longitude: 121.0302,
      images: [
        "https://example.com/makati-1.jpg",
        "https://example.com/makati-2.jpg",
        "https://example.com/makati-3.jpg",
      ],
    },
    {
      address2: "Manila",
      address3: "Eastwood City",
      address4: "Unit 1809",
      latitude: 14.6091,
      longitude: 121.0807,
      images: [
        "https://example.com/qc-1.jpg",
        "https://example.com/qc-2.jpg",
        "https://example.com/qc-3.jpg",
        "https://example.com/qc-4.jpg",
      ],
    },
  ];

  // 1만 개의 유닛 데이터 생성
  for (let i = 0; i < 5000; i++) {
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomSellType = sellTypes[Math.floor(Math.random() * sellTypes.length)];
    const randomAdminId = admins[Math.floor(Math.random() * admins.length)];
    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];

    // 좌표에 랜덤 변동 추가 (작은 오프셋)
    const randomLatitude = randomAddress.latitude + (Math.random() * 0.01 - 0.008); // -0.005 ~ 0.005
    const randomLongitude = randomAddress.longitude + (Math.random() * 0.01 - 0.008); // -0.005 ~ 0.005

    unitPromises.push(
      prisma.unit.create({
        data: {
          adminId: randomAdminId, // 랜덤 어드민 ID
          title: `Sample Unit ${i + 1}`,
          type: randomType, // 무작위 타입 선택
          sellType: randomSellType, // 무작위 판매 유형 선택
          address1: 1000 + i, // 우편번호 또는 고유번호
          address2: randomAddress.address2,
          address3: randomAddress.address3,
          address4: randomAddress.address4,
          addressSelf: "Broker added address",
          ownerName: `Owner ${i + 1}`,
          ownerMobile: `091987654${i % 100}`, // Random mobile numbers
          area: 50 + (i % 100), // Random area sizes
          floor: Math.floor(Math.random() * 30), // Random floor number
          bed: Math.floor(Math.random() * 5) + 1, // Random bed count (1~5)
          bath: Math.floor(Math.random() * 3) + 1, // Random bath count (1~3)
          parking: Math.floor(Math.random() * 2), // Random parking availability (0 or 1)
          furniture: furnitureOptions[Math.floor(Math.random() * 4)].value,
          interiored: 'Contemporary',
          petPolicy: petPolicyOption[Math.floor(Math.random() * 4)].value,
          amenity: 'Gym, Spa',
          yearCompletion: '2015',
          outstandingPayment: Math.random() * 20000, // Random outstanding payment
          price: 20000 + Math.random() * 30000, // Random rent price
          priceRent: 20000 + Math.random() * 30000, // Random rent price
          note: "Located near shopping centers.",
          requested: "Looking for a long-term lease.",
          images: randomAddress.images, // 랜덤 주소의 이미지
          mapinfo: `${randomLatitude},${randomLongitude}`, // 지도 정보
          status: 1,
          lastUpdate: new Date(),
          regdate: new Date(),
          latitude: randomLatitude, // 필리핀 내 랜덤 위도
          longitude: randomLongitude, // 필리핀 내 랜덤 경도
        },
      })
    );
  }

  // 모든 데이터 삽입
  await Promise.all(unitPromises);

  console.log('Inserted 5,000 units');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
