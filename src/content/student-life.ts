import type { ContentSource, StudentSociety } from "../types/content";

const source: ContentSource = {
  sourceUrl: "https://rcet.uet.edu.pk/campus/Student-Societies",
  checkedAt: "2026-10-02",
  status: "observed",
  notes: ["Names and founding years as listed on the live Student Societies page; officer names intentionally omitted."],
};

export const studentSocieties = [
  { id: "ieee", name: "IEEE", foundedYear: 2016, source },
  { id: "prosoft", name: "ProSoft", foundedYear: 2014, source },
  { id: "cdes", name: "Cultural, Dramatics & Entertainment Society", foundedYear: 2008, source },
  { id: "uet-tribune", name: "UET Tribune", foundedYear: 2015, source },
  { id: "rss", name: "Rachna Sports Society", foundedYear: 2010, source },
  { id: "wie", name: "Women in Engineering", foundedYear: 2017, source },
  { id: "asme", name: "ASME RCET Chapter", foundedYear: 2019, source },
  { id: "rcs", name: "Rachna Community Service", foundedYear: 2018, source },
  { id: "uet-news", name: "UET News", foundedYear: 2016, source },
  { id: "jzt", name: "Jehaad For Zero Thalassemia", foundedYear: 2012, source },
] satisfies readonly StudentSociety[];
