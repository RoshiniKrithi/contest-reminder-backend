import { db } from "./db.js";
import { courses as coursesTable, lessons as lessonsTable } from "./shared/schema.js";
import { MemStorage } from "./storage.js";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Starting forced seed...");
  const mem = new MemStorage();
  
  const allMemCourses = await mem.getAllCourses();
  for (const course of allMemCourses) {
    const existing = await db.select().from(coursesTable).where(eq(coursesTable.title, course.title)).limit(1);
    
    let dbCourseId = course.id;

    if (!existing.length) {
       await db.insert(coursesTable).values({
         title: course.title,
         description: course.description,
         level: course.level,
         duration: course.duration,
         difficulty: course.difficulty,
         topics: course.topics,
         prerequisites: course.prerequisites,
         instructor: course.instructor,
         rating: Math.round(Number(course.rating) || 5),
         students: course.students,
         price: course.price,
         thumbnail: course.thumbnail,
         isActive: course.isActive,
         createdAt: course.createdAt
       } as any);
       console.log("Inserted course:", course.title);
    } else {
       dbCourseId = existing[0].id;
       console.log("Course exists:", course.title);
    }

    const allMemLessons = await mem.getLessonsByCourse(course.id);
    for (const lesson of allMemLessons) {
      const existingLesson = await db.select().from(lessonsTable).where(eq(lessonsTable.title, lesson.title)).limit(1);
      if (!existingLesson.length) {
         try {
           await db.insert(lessonsTable).values({
             courseId: dbCourseId,
             title: lesson.title,
             description: lesson.description,
             content: lesson.content,
             order: lesson.order,
             duration: lesson.duration,
             videoUrl: lesson.videoUrl as string | null,
             type: lesson.type,
             quizData: lesson.quizData as any,
             isActive: lesson.isActive,
             createdAt: lesson.createdAt
           } as any);
           console.log("Inserted lesson:", lesson.title);
         } catch (e) {
           console.error("Failed to insert lesson:", lesson.title, e);
         }
      } else {
        console.log("Lesson exists:", lesson.title);
      }
    }
  }
}

run().then(() => { 
  console.log('Done DB seed'); 
  process.exit(0); 
}).catch(console.error);
