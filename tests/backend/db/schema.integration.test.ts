import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";

// Integration test (real Postgres, no mocks) for AI-1657/AI-1658/AI-1660/AI-1661:
// the Prisma schema for the full domain model, and the initial migration
// applied against a real local Postgres (see repo-root docker-compose.yml,
// `docker-compose up -d`).
//
// This test is intentionally RED before backend/src/db/schema.prisma exists
// and `npx prisma migrate dev --name init` has been run against it: there is
// no generated @prisma/client, so the import above fails and/or the tables
// referenced below do not exist.

const prisma = new PrismaClient();

// Unique-ish suffix per test run so re-runs against a persistent dev DB don't
// collide with previously-inserted rows from a prior run.
const suffix = Date.now().toString();

describe("Prisma schema — domain model (real Postgres, no mocks)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates one of every model with realistic relations, and enforces DB-level constraints", async () => {
    const admin = await prisma.admin.create({
      data: {
        name: "Ada Admin",
        email: `ada.${suffix}@school.test`,
        passwordHash: "hashed",
      },
    });
    expect(admin.id).toBeTruthy();

    const klass = await prisma.class.create({
      data: { name: `Grade 10 - A ${suffix}` },
    });

    const student = await prisma.student.create({
      data: {
        name: "Sam Student",
        email: `sam.${suffix}@school.test`,
        passwordHash: "hashed",
        classId: klass.id,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        name: "Terry Teacher",
        email: `terry.${suffix}@school.test`,
        passwordHash: "hashed",
      },
    });

    const subject = await prisma.subject.create({
      data: { name: `Mathematics ${suffix}` },
    });

    const enrollment = await prisma.enrollment.create({
      data: { studentId: student.id, subjectId: subject.id },
    });
    expect(enrollment.studentId).toBe(student.id);
    expect(enrollment.subjectId).toBe(subject.id);

    // AC #4: TeacherAssignment.classId omitted on create -> accepted as null
    // ("null = all classes for this subject").
    const assignment = await prisma.teacherAssignment.create({
      data: { teacherId: teacher.id, subjectId: subject.id },
    });
    expect(assignment.classId).toBeNull();

    const now = new Date();
    const session = await prisma.session.create({
      data: {
        subjectId: subject.id,
        startsAt: now,
        endsAt: new Date(now.getTime() + 60 * 60 * 1000),
      },
    });
    // Session.startsAt/endsAt must be typed and stored as real Date values.
    expect(session.startsAt).toBeInstanceOf(Date);
    expect(session.endsAt).toBeInstanceOf(Date);

    const record = await prisma.attendanceRecord.create({
      data: {
        studentId: student.id,
        sessionId: session.id,
        markedAt: now,
      },
    });
    // Decision A: only PRESENT is ever written; it's also the column default.
    expect(record.status).toBe("PRESENT");

    // Navigable, strongly-typed relations for every FK (AI-1661).
    const studentWithRelations = await prisma.student.findUniqueOrThrow({
      where: { id: student.id },
      include: { class: true, enrollments: true, records: true },
    });
    expect(studentWithRelations.class.id).toBe(klass.id);
    expect(studentWithRelations.enrollments).toHaveLength(1);
    expect(studentWithRelations.records).toHaveLength(1);

    const subjectWithRelations = await prisma.subject.findUniqueOrThrow({
      where: { id: subject.id },
      include: { enrollments: true, assignments: true, sessions: true },
    });
    expect(subjectWithRelations.enrollments).toHaveLength(1);
    expect(subjectWithRelations.assignments).toHaveLength(1);
    expect(subjectWithRelations.sessions).toHaveLength(1);

    const enrollmentWithRelations = await prisma.enrollment.findUniqueOrThrow({
      where: { id: enrollment.id },
      include: { student: true, subject: true },
    });
    expect(enrollmentWithRelations.student.id).toBe(student.id);
    expect(enrollmentWithRelations.subject.id).toBe(subject.id);

    // Non-negotiable #4: duplicate (studentId, sessionId) is rejected by the
    // DB unique constraint, not app-level logic — exercised for real here,
    // no mocks. The future marking flow relies on catching this P2002.
    await expect(
      prisma.attendanceRecord.create({
        data: {
          studentId: student.id,
          sessionId: session.id,
          markedAt: new Date(),
        },
      }),
    ).rejects.toMatchObject(
      expect.objectContaining({
        code: "P2002",
      }),
    );

    const isKnownRequestError = (
      e: unknown,
    ): e is Prisma.PrismaClientKnownRequestError =>
      e instanceof Prisma.PrismaClientKnownRequestError;

    try {
      await prisma.attendanceRecord.create({
        data: {
          studentId: student.id,
          sessionId: session.id,
          markedAt: new Date(),
        },
      });
      throw new Error("expected duplicate insert to throw P2002");
    } catch (e) {
      expect(isKnownRequestError(e)).toBe(true);
      if (isKnownRequestError(e)) {
        expect(e.code).toBe("P2002");
      }
    }
  });
});
