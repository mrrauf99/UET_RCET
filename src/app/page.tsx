import { Admissions } from "@/components/sections/Admissions";
import { CampusMap } from "@/components/sections/CampusMap";
import { CoordinatorMessage } from "@/components/sections/CoordinatorMessage";
import { Departments } from "@/components/sections/Departments";
import { Facilities, type FacilityGroup } from "@/components/sections/Facilities";
import { Hero } from "@/components/sections/Hero";
import { Introduction } from "@/components/sections/Introduction";
import { Programs } from "@/components/sections/Programs";
import { StudentLife } from "@/components/sections/StudentLife";
import { departmentCardImages } from "@/content/department-media";
import {
  getDepartments,
  getFacilities,
  getHomepage,
  getImage,
  getPrograms,
  getStudentSocieties,
  getUniversity,
} from "@/lib/content";
import type { ImageAsset } from "@/types/content";

const FACILITY_GROUPS = [
  {
    id: "learning",
    title: "Learning and community",
    ids: [
      "central-library",
      "auditorium",
      "computer-science-smart-class-room-video-conferencing",
      "mechanical-engineering-workshop",
      "mosque",
    ],
  },
  {
    id: "sport",
    title: "Sport",
    ids: ["cricket-ground", "football-field", "basketball-court", "badminton-court", "gymnasium"],
  },
] as const;

// Curated from the old campus-life galleries: only photos that are sharp and clearly show student life.
const STUDENT_LIFE_PHOTOS = ["image-023", "image-018", "image-019", "image-015"];

export default async function HomePage() {
  const [university, homepage, departments, programs, facilities, societies] = await Promise.all([
    getUniversity(),
    getHomepage(),
    getDepartments(),
    getPrograms(),
    getFacilities(),
    getStudentSocieties(),
  ]);

  const [heroImage, introImage, departmentImages, coordinatorPortrait, libraryImage, studentPhotos] = await Promise.all([
    homepage.hero.imageIds[0] ? getImage(homepage.hero.imageIds[0]) : null,
    getImage(homepage.introduction.imageId),
    Promise.all(
      departments.map(async (department) => [
        department.id,
        await getImage(departmentCardImages[department.id] ?? department.imageId),
      ] as const),
    ),
    getImage(homepage.coordinatorMessage.imageId),
    getImage("image-037"),
    Promise.all(STUDENT_LIFE_PHOTOS.map((id) => getImage(id))),
  ]);

  const images = new Map(
    departmentImages.filter((entry): entry is readonly [string, ImageAsset] => entry[1] !== null),
  );

  const labs = facilities.filter((facility) => /\blab\b/i.test(facility.name)).length;
  const facilityGroups: FacilityGroup[] = FACILITY_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    facilities: group.ids.flatMap((id) => facilities.filter((facility) => facility.id === id)),
  }));

  return (
    <>
      <Hero image={heroImage} />
      <Programs programs={programs} departments={departments} />
      <Introduction content={homepage.introduction} image={introImage} />
      <Departments departments={departments} programs={programs} facilities={facilities} images={images} />
      <Facilities groups={facilityGroups} labCount={labs} image={libraryImage} />
      <CoordinatorMessage message={homepage.coordinatorMessage} portrait={coordinatorPortrait} />
      <StudentLife societies={societies} photos={studentPhotos.filter((photo): photo is ImageAsset => photo !== null)} />
      <Admissions university={university} />
      <CampusMap university={university} />
    </>
  );
}
