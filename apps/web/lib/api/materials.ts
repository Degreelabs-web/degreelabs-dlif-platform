import { apiClient } from "./client";

export type Material = { id:string; title:string; description?:string|null; category?:string|null; material_type:string; status:string; visibility:string; student_access_mode:"no_access"|"view_download"|"download_editable_copy"; external_url?:string|null; is_featured:boolean; published_at?:string|null; updated_at:string; asset?:{original_filename?:string|null; version:number}|null };
export type MaterialList = { items: Material[]; total:number; page:number; limit:number };
export type MaterialAccess = { access_type:string; url:string; filename?:string|null; student_access_mode?:Material["student_access_mode"]|null };
export type MaterialInput = { title:string; description?:string; category?:string; material_type:string; visibility:string; student_access_mode?:Material["student_access_mode"]; external_url?:string; is_featured?:boolean; publish_immediately?:boolean; audience?:{cohort_ids?:string[];institution_ids?:string[];mentor_categories?:string[]} };
const query=(params:Record<string,string|undefined>)=>{const p=new URLSearchParams();Object.entries(params).forEach(([k,v])=>v&&p.set(k,v));return p.toString()?`?${p}`:""};
export const getAdminMaterials=(params:Record<string,string|undefined>={})=>apiClient<MaterialList>(`/admin/materials${query(params)}`);
export const createMaterial=(data:MaterialInput)=>apiClient<Material>("/admin/materials",{method:"POST",body:JSON.stringify(data)});
export const updateMaterial=(id:string,data:Partial<MaterialInput>)=>apiClient<Material>(`/admin/materials/${id}`,{method:"PATCH",body:JSON.stringify(data)});
export const publishMaterial=(id:string)=>apiClient<Material>(`/admin/materials/${id}/publish`,{method:"POST"});
export const archiveMaterial=(id:string)=>apiClient<Material>(`/admin/materials/${id}/archive`,{method:"POST"});
export const restoreMaterial=(id:string)=>apiClient<Material>(`/admin/materials/${id}/restore`,{method:"POST"});
export const deleteMaterial=(id:string)=>apiClient<void>(`/admin/materials/${id}`,{method:"DELETE"});
export const uploadMaterialAsset=(id:string,file:File)=>{const f=new FormData();f.append("file",file);return apiClient<Material>(`/admin/materials/${id}/assets`,{method:"POST",body:f});};
export const getStudentMaterials=(params:Record<string,string|undefined>={})=>apiClient<MaterialList>(`/student/materials${query(params)}`);
export const getMentorMaterials=(params:Record<string,string|undefined>={})=>apiClient<MaterialList>(`/mentor/materials${query(params)}`);
export const getMaterialAccess=(role:"student"|"mentor",id:string)=>apiClient<MaterialAccess>(`/${role}/materials/${id}/access`);
