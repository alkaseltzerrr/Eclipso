"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌌 Starting Eclipso database seeding...');
    // Create sample interests
    const interests = [
        { name: 'Music', category: 'entertainment' },
        { name: 'Coding', category: 'work' },
        { name: 'Coffee', category: 'lifestyle' },
        { name: 'Photography', category: 'creative' },
        { name: 'Reading', category: 'learning' },
        { name: 'Travel', category: 'adventure' },
        { name: 'Gaming', category: 'entertainment' },
        { name: 'Fitness', category: 'lifestyle' },
        { name: 'Cooking', category: 'lifestyle' },
        { name: 'Art', category: 'creative' },
    ];
    console.log('📚 Creating interests...');
    for (const interest of interests) {
        await prisma.interest.upsert({
            where: { name: interest.name },
            update: {},
            create: interest,
        });
    }
    // Create sample users
    console.log('👥 Creating sample users...');
    const user1 = await prisma.user.upsert({
        where: { email: 'alice@eclipso.app' },
        update: {},
        create: {
            email: 'alice@eclipso.app',
            username: 'cosmic_alice',
            password: await bcryptjs_1.default.hash('password123', 10),
            avatar: '#8A5DFF',
            isOnboarded: true,
        },
    });
    const user2 = await prisma.user.upsert({
        where: { email: 'bob@eclipso.app' },
        update: {},
        create: {
            email: 'bob@eclipso.app',
            username: 'stellar_bob',
            password: await bcryptjs_1.default.hash('password123', 10),
            avatar: '#FF4F91',
            isOnboarded: true,
        },
    });
    // Add interests to users
    console.log('⭐ Adding interests to users...');
    const musicInterest = await prisma.interest.findUnique({ where: { name: 'Music' } });
    const codingInterest = await prisma.interest.findUnique({ where: { name: 'Coding' } });
    const coffeeInterest = await prisma.interest.findUnique({ where: { name: 'Coffee' } });
    const travelInterest = await prisma.interest.findUnique({ where: { name: 'Travel' } });
    if (musicInterest && codingInterest && coffeeInterest && travelInterest) {
        // Alice's interests
        await prisma.userInterest.upsert({
            where: {
                userId_interestId: {
                    userId: user1.id,
                    interestId: musicInterest.id
                }
            },
            update: {},
            create: { userId: user1.id, interestId: musicInterest.id },
        });
        await prisma.userInterest.upsert({
            where: {
                userId_interestId: {
                    userId: user1.id,
                    interestId: codingInterest.id
                }
            },
            update: {},
            create: { userId: user1.id, interestId: codingInterest.id },
        });
        await prisma.userInterest.upsert({
            where: {
                userId_interestId: {
                    userId: user1.id,
                    interestId: coffeeInterest.id
                }
            },
            update: {},
            create: { userId: user1.id, interestId: coffeeInterest.id },
        });
        // Bob's interests (overlapping with Alice)
        await prisma.userInterest.upsert({
            where: {
                userId_interestId: {
                    userId: user2.id,
                    interestId: codingInterest.id
                }
            },
            update: {},
            create: { userId: user2.id, interestId: codingInterest.id },
        });
        await prisma.userInterest.upsert({
            where: {
                userId_interestId: {
                    userId: user2.id,
                    interestId: coffeeInterest.id
                }
            },
            update: {},
            create: { userId: user2.id, interestId: coffeeInterest.id },
        });
        await prisma.userInterest.upsert({
            where: {
                userId_interestId: {
                    userId: user2.id,
                    interestId: travelInterest.id
                }
            },
            update: {},
            create: { userId: user2.id, interestId: travelInterest.id },
        });
    }
    // Create partnership
    console.log('🤝 Creating partnership...');
    const partnership = await prisma.partnership.upsert({
        where: {
            userId_partnerId: {
                userId: user1.id,
                partnerId: user2.id
            }
        },
        update: {},
        create: {
            userId: user1.id,
            partnerId: user2.id,
            status: 'active',
        },
    });
    // Create sample messages
    console.log('💬 Creating sample messages...');
    await prisma.message.create({
        data: {
            content: 'Hey! Welcome to our cosmic connection! 🛰️',
            senderId: user1.id,
            receiverId: user2.id,
            partnershipId: partnership.id,
        },
    });
    await prisma.message.create({
        data: {
            content: 'This is amazing! Our stars are aligning perfectly ✨',
            senderId: user2.id,
            receiverId: user1.id,
            partnershipId: partnership.id,
        },
    });
    // Create sample capsules
    console.log('💎 Creating sample capsules...');
    await prisma.capsule.create({
        data: {
            title: 'First Connection',
            content: 'Remember this moment - when our cosmic paths first crossed. The universe brought us together through shared interests in coding and coffee. What a beautiful beginning! ☕💻',
            type: 'text',
            isLocked: false,
            createdById: user1.id,
            partnershipId: partnership.id,
        },
    });
    await prisma.capsule.create({
        data: {
            title: 'Future Dreams',
            content: 'This capsule holds our shared dream of traveling the world together, exploring new cultures and coding from exotic locations. One day we\'ll unlock this when we\'re ready for our adventure! 🌍',
            type: 'text',
            isLocked: true,
            createdById: user2.id,
            partnershipId: partnership.id,
        },
    });
    // Create constellation data
    console.log('🌟 Creating constellation data...');
    await prisma.constellationData.create({
        data: {
            partnershipId: partnership.id,
            stars: {
                sharedStars: [
                    { id: 'coding', name: 'Coding', x: 200, y: 150, brightness: 0.9, category: 'work' },
                    { id: 'coffee', name: 'Coffee', x: 300, y: 200, brightness: 0.8, category: 'lifestyle' }
                ],
                constellations: [
                    {
                        id: 'creative-connection',
                        name: 'Creative Connection',
                        stars: ['coding', 'coffee'],
                        connections: [[0, 1]]
                    }
                ]
            },
            orbitLevel: 75,
        },
    });
    console.log('🎉 Seeding completed successfully!');
    console.log('');
    console.log('Sample users created:');
    console.log('📧 alice@eclipso.app / password: password123');
    console.log('📧 bob@eclipso.app / password: password123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map