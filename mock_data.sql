DO $$
DECLARE
  t_0 uuid;
  t_1 uuid;
  t_2 uuid;
  c_0 uuid;
  c_1 uuid;
  c_2 uuid;
  c_3 uuid;
  c_4 uuid;
  c_5 uuid;
  c_6 uuid;
  c_7 uuid;
  c_8 uuid;
  c_9 uuid;
  c_10 uuid;
  c_11 uuid;
  c_12 uuid;
  c_13 uuid;
  c_14 uuid;
  c_15 uuid;
  c_16 uuid;
  c_17 uuid;
  c_18 uuid;
  c_19 uuid;
  c_20 uuid;
  c_21 uuid;
  c_22 uuid;
  c_23 uuid;
  c_24 uuid;
  c_25 uuid;
  c_26 uuid;
  c_27 uuid;
  c_28 uuid;
  d_0 uuid;
  d_1 uuid;
  d_2 uuid;
  d_3 uuid;
  d_4 uuid;
  d_5 uuid;
  d_6 uuid;
  d_7 uuid;
  d_8 uuid;
  d_9 uuid;
  d_10 uuid;
  d_11 uuid;
  d_12 uuid;
  d_13 uuid;
  d_14 uuid;
  d_15 uuid;
  d_16 uuid;
  d_17 uuid;
  d_18 uuid;
  d_19 uuid;
  d_20 uuid;
  d_21 uuid;
  d_22 uuid;
  d_23 uuid;
  d_24 uuid;
  d_25 uuid;
  d_26 uuid;
  d_27 uuid;
  d_28 uuid;
  d_29 uuid;
  d_30 uuid;
  d_31 uuid;
  d_32 uuid;
  d_33 uuid;
  d_34 uuid;
  d_35 uuid;
  d_36 uuid;
  d_37 uuid;
  d_38 uuid;
  d_39 uuid;
  d_40 uuid;
  d_41 uuid;
  d_42 uuid;
  d_43 uuid;
  d_44 uuid;
  d_45 uuid;
  d_46 uuid;
  d_47 uuid;
  d_48 uuid;
  d_49 uuid;
  d_50 uuid;
  d_51 uuid;
  d_52 uuid;
  d_53 uuid;
  d_54 uuid;
  d_55 uuid;
  d_56 uuid;
  d_57 uuid;
  d_58 uuid;
  d_59 uuid;
  d_60 uuid;
  d_61 uuid;
  d_62 uuid;
  d_63 uuid;
  d_64 uuid;
  d_65 uuid;
  d_66 uuid;
  d_67 uuid;
  d_68 uuid;
  d_69 uuid;
  d_70 uuid;
  d_71 uuid;
  d_72 uuid;
  d_73 uuid;
  d_74 uuid;
  d_75 uuid;
  d_76 uuid;
  d_77 uuid;
  d_78 uuid;
  d_79 uuid;
  ch_0 uuid;
  ch_1 uuid;
  ch_2 uuid;
  ch_3 uuid;
  ch_4 uuid;
  ch_5 uuid;
  ch_6 uuid;
  ch_7 uuid;
  ch_8 uuid;
  ch_9 uuid;
  ch_10 uuid;
  ch_11 uuid;
  ch_12 uuid;
  ch_13 uuid;
  ch_14 uuid;
  ch_15 uuid;
  ch_16 uuid;
  ch_17 uuid;
  ch_18 uuid;
  ch_19 uuid;
  ch_20 uuid;
  ch_21 uuid;
  ch_22 uuid;
  ch_23 uuid;
  ch_24 uuid;
  ch_25 uuid;
BEGIN
  -- Teachers
  INSERT INTO public.teachers (name) VALUES ('Sônia Pimenta') RETURNING id INTO t_0;
  INSERT INTO public.teachers (name) VALUES ('Roberto Cintra') RETURNING id INTO t_1;
  INSERT INTO public.teachers (name) VALUES ('Carlos Acosta') RETURNING id INTO t_2;

  -- Classes
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Grupo Coreográfico') RETURNING id INTO c_0;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_2, 'Ballet Juvenil 5ª') RETURNING id INTO c_1;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Baby Class Sábado 10h') RETURNING id INTO c_2;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_2, 'Ballet Adulto I') RETURNING id INTO c_3;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Ballet Infantil Sábado') RETURNING id INTO c_4;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_2, 'Ballet Juvenil Sábado') RETURNING id INTO c_5;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Baby Class 3ª e Sábado 11h') RETURNING id INTO c_6;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Ballet Adulto II') RETURNING id INTO c_7;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_2, 'Ballet Infantil 4ª') RETURNING id INTO c_8;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Solo Neto') RETURNING id INTO c_9;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_2, 'Sapateado Infantil') RETURNING id INTO c_10;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Contemporâneo Intermediário') RETURNING id INTO c_11;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Street Iniciante') RETURNING id INTO c_12;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Jazz Juvenil 3ª') RETURNING id INTO c_13;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Street Juvenil') RETURNING id INTO c_14;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Solo Marcelo') RETURNING id INTO c_15;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Contemporâneo Iniciante') RETURNING id INTO c_16;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Funk') RETURNING id INTO c_17;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_2, 'Sapateado Juvenil') RETURNING id INTO c_18;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Ritmos') RETURNING id INTO c_19;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Kpop Intermediário') RETURNING id INTO c_20;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Kpop Iniciante') RETURNING id INTO c_21;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Stiletto Intermediário') RETURNING id INTO c_22;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Sapateado Adulto') RETURNING id INTO c_23;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_2, 'Duo Matheus/Beatriz') RETURNING id INTO c_24;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_2, 'Stiletto Iniciante') RETURNING id INTO c_25;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Jazz Juvenil Sábado') RETURNING id INTO c_26;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_1, 'Solo Isabellha') RETURNING id INTO c_27;
  INSERT INTO public.classes (teacher_id, modality) VALUES (t_0, 'Street Avançado') RETURNING id INTO c_28;

  -- Dancers
  INSERT INTO public.dancers (name) VALUES ('Neto Alves') RETURNING id INTO d_0;
  INSERT INTO public.dancers (name) VALUES ('Marcelo Pereira') RETURNING id INTO d_1;
  INSERT INTO public.dancers (name) VALUES ('Isabellha Carvalho') RETURNING id INTO d_2;
  INSERT INTO public.dancers (name) VALUES ('Matheus Vieira') RETURNING id INTO d_3;
  INSERT INTO public.dancers (name) VALUES ('Beatriz Rocha') RETURNING id INTO d_4;
  INSERT INTO public.dancers (name) VALUES ('Gustavo Silva') RETURNING id INTO d_5;
  INSERT INTO public.dancers (name) VALUES ('Caio Vieira') RETURNING id INTO d_6;
  INSERT INTO public.dancers (name) VALUES ('Gabriel Silva') RETURNING id INTO d_7;
  INSERT INTO public.dancers (name) VALUES ('Laura Andrade') RETURNING id INTO d_8;
  INSERT INTO public.dancers (name) VALUES ('Enzo Lima') RETURNING id INTO d_9;
  INSERT INTO public.dancers (name) VALUES ('Eduardo Martins') RETURNING id INTO d_10;
  INSERT INTO public.dancers (name) VALUES ('Luiza Souza') RETURNING id INTO d_11;
  INSERT INTO public.dancers (name) VALUES ('Letícia Martins') RETURNING id INTO d_12;
  INSERT INTO public.dancers (name) VALUES ('Sofia Silva') RETURNING id INTO d_13;
  INSERT INTO public.dancers (name) VALUES ('Pedro Carvalho') RETURNING id INTO d_14;
  INSERT INTO public.dancers (name) VALUES ('Fernanda Pereira') RETURNING id INTO d_15;
  INSERT INTO public.dancers (name) VALUES ('João Barbosa') RETURNING id INTO d_16;
  INSERT INTO public.dancers (name) VALUES ('Letícia Carvalho') RETURNING id INTO d_17;
  INSERT INTO public.dancers (name) VALUES ('Isabellha Ribeiro') RETURNING id INTO d_18;
  INSERT INTO public.dancers (name) VALUES ('Thiago Barbosa') RETURNING id INTO d_19;
  INSERT INTO public.dancers (name) VALUES ('Enzo Costa') RETURNING id INTO d_20;
  INSERT INTO public.dancers (name) VALUES ('Bruno Souza') RETURNING id INTO d_21;
  INSERT INTO public.dancers (name) VALUES ('Clara Carvalho') RETURNING id INTO d_22;
  INSERT INTO public.dancers (name) VALUES ('Letícia Oliveira') RETURNING id INTO d_23;
  INSERT INTO public.dancers (name) VALUES ('Rafael Martins') RETURNING id INTO d_24;
  INSERT INTO public.dancers (name) VALUES ('Sofia Costa') RETURNING id INTO d_25;
  INSERT INTO public.dancers (name) VALUES ('Marcelo Vieira') RETURNING id INTO d_26;
  INSERT INTO public.dancers (name) VALUES ('Samuel Freitas') RETURNING id INTO d_27;
  INSERT INTO public.dancers (name) VALUES ('Arthur Soares') RETURNING id INTO d_28;
  INSERT INTO public.dancers (name) VALUES ('Samuel Carvalho') RETURNING id INTO d_29;
  INSERT INTO public.dancers (name) VALUES ('Gabriel Lima') RETURNING id INTO d_30;
  INSERT INTO public.dancers (name) VALUES ('Ana Barbosa') RETURNING id INTO d_31;
  INSERT INTO public.dancers (name) VALUES ('Clara Santos') RETURNING id INTO d_32;
  INSERT INTO public.dancers (name) VALUES ('Valentina Mendes') RETURNING id INTO d_33;
  INSERT INTO public.dancers (name) VALUES ('Isabellha Freitas') RETURNING id INTO d_34;
  INSERT INTO public.dancers (name) VALUES ('Letícia Silva') RETURNING id INTO d_35;
  INSERT INTO public.dancers (name) VALUES ('João Andrade') RETURNING id INTO d_36;
  INSERT INTO public.dancers (name) VALUES ('Bruno Rodrigues') RETURNING id INTO d_37;
  INSERT INTO public.dancers (name) VALUES ('Gustavo Machado') RETURNING id INTO d_38;
  INSERT INTO public.dancers (name) VALUES ('Letícia Alves') RETURNING id INTO d_39;
  INSERT INTO public.dancers (name) VALUES ('Valentina Nunes') RETURNING id INTO d_40;
  INSERT INTO public.dancers (name) VALUES ('Bruno Almeida') RETURNING id INTO d_41;
  INSERT INTO public.dancers (name) VALUES ('João Nunes') RETURNING id INTO d_42;
  INSERT INTO public.dancers (name) VALUES ('Miguel Gomes') RETURNING id INTO d_43;
  INSERT INTO public.dancers (name) VALUES ('Luiza Nascimento') RETURNING id INTO d_44;
  INSERT INTO public.dancers (name) VALUES ('Laura Silva') RETURNING id INTO d_45;
  INSERT INTO public.dancers (name) VALUES ('Clara Ribeiro') RETURNING id INTO d_46;
  INSERT INTO public.dancers (name) VALUES ('Fernanda Almeida') RETURNING id INTO d_47;
  INSERT INTO public.dancers (name) VALUES ('Guilherme Andrade') RETURNING id INTO d_48;
  INSERT INTO public.dancers (name) VALUES ('Isabellha Vieira') RETURNING id INTO d_49;
  INSERT INTO public.dancers (name) VALUES ('Matheus Carvalho') RETURNING id INTO d_50;
  INSERT INTO public.dancers (name) VALUES ('Manuela Ribeiro') RETURNING id INTO d_51;
  INSERT INTO public.dancers (name) VALUES ('Enzo Ribeiro') RETURNING id INTO d_52;
  INSERT INTO public.dancers (name) VALUES ('Marcelo Almeida') RETURNING id INTO d_53;
  INSERT INTO public.dancers (name) VALUES ('Laura Gomes') RETURNING id INTO d_54;
  INSERT INTO public.dancers (name) VALUES ('Rafael Pereira') RETURNING id INTO d_55;
  INSERT INTO public.dancers (name) VALUES ('Neto Oliveira') RETURNING id INTO d_56;
  INSERT INTO public.dancers (name) VALUES ('Vinícius Moreira') RETURNING id INTO d_57;
  INSERT INTO public.dancers (name) VALUES ('Diego Fernandes') RETURNING id INTO d_58;
  INSERT INTO public.dancers (name) VALUES ('Arthur Silva') RETURNING id INTO d_59;
  INSERT INTO public.dancers (name) VALUES ('Lorenzo Rodrigues') RETURNING id INTO d_60;
  INSERT INTO public.dancers (name) VALUES ('Alice Rocha') RETURNING id INTO d_61;
  INSERT INTO public.dancers (name) VALUES ('Caio Freitas') RETURNING id INTO d_62;
  INSERT INTO public.dancers (name) VALUES ('Clara Pereira') RETURNING id INTO d_63;
  INSERT INTO public.dancers (name) VALUES ('Beatriz Rocha') RETURNING id INTO d_64;
  INSERT INTO public.dancers (name) VALUES ('Rafael Moreira') RETURNING id INTO d_65;
  INSERT INTO public.dancers (name) VALUES ('Luiza Marques') RETURNING id INTO d_66;
  INSERT INTO public.dancers (name) VALUES ('Julia Barbosa') RETURNING id INTO d_67;
  INSERT INTO public.dancers (name) VALUES ('Maria Rocha') RETURNING id INTO d_68;
  INSERT INTO public.dancers (name) VALUES ('Beatriz Lopes') RETURNING id INTO d_69;
  INSERT INTO public.dancers (name) VALUES ('Marcelo Vieira') RETURNING id INTO d_70;
  INSERT INTO public.dancers (name) VALUES ('Gustavo Oliveira') RETURNING id INTO d_71;
  INSERT INTO public.dancers (name) VALUES ('Vinícius Rocha') RETURNING id INTO d_72;
  INSERT INTO public.dancers (name) VALUES ('Eduardo Soares') RETURNING id INTO d_73;
  INSERT INTO public.dancers (name) VALUES ('Theo Machado') RETURNING id INTO d_74;
  INSERT INTO public.dancers (name) VALUES ('Enzo Ribeiro') RETURNING id INTO d_75;
  INSERT INTO public.dancers (name) VALUES ('Vinícius Freitas') RETURNING id INTO d_76;
  INSERT INTO public.dancers (name) VALUES ('Letícia Soares') RETURNING id INTO d_77;
  INSERT INTO public.dancers (name) VALUES ('Pedro Machado') RETURNING id INTO d_78;
  INSERT INTO public.dancers (name) VALUES ('Miguel Andrade') RETURNING id INTO d_79;

  -- Dancer Classes (Random assignment)
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_0, c_9);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_1, c_15);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_2, c_27);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_3, c_24);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_4, c_24);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_5, c_1);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_5, c_3);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_6, c_16);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_6, c_18);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_7, c_17);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_7, c_11);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_8, c_18);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_9, c_16);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_9, c_11);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_10, c_25);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_11, c_8);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_12, c_20);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_12, c_28);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_12, c_2);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_13, c_3);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_13, c_7);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_14, c_20);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_14, c_16);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_14, c_23);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_15, c_16);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_16, c_8);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_16, c_25);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_16, c_26);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_17, c_17);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_18, c_27);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_19, c_20);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_19, c_0);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_19, c_25);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_20, c_16);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_21, c_23);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_21, c_11);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_21, c_0);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_22, c_5);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_22, c_7);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_22, c_14);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_23, c_8);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_23, c_13);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_23, c_26);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_24, c_11);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_24, c_12);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_24, c_2);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_25, c_6);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_26, c_15);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_27, c_23);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_27, c_25);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_28, c_8);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_29, c_13);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_29, c_26);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_30, c_0);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_31, c_1);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_31, c_8);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_31, c_17);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_32, c_17);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_32, c_19);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_33, c_25);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_33, c_1);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_34, c_27);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_35, c_19);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_35, c_22);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_36, c_26);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_36, c_4);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_37, c_19);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_37, c_17);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_38, c_22);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_38, c_2);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_39, c_17);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_40, c_28);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_40, c_8);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_40, c_12);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_41, c_19);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_41, c_22);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_42, c_1);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_42, c_6);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_42, c_10);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_43, c_14);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_43, c_1);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_44, c_1);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_45, c_7);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_45, c_22);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_46, c_7);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_46, c_12);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_47, c_18);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_47, c_7);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_47, c_28);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_48, c_26);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_49, c_27);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_50, c_24);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_51, c_7);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_51, c_6);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_52, c_11);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_53, c_15);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_54, c_0);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_55, c_21);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_55, c_4);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_56, c_9);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_57, c_0);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_57, c_17);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_57, c_2);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_58, c_20);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_58, c_0);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_58, c_2);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_59, c_8);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_59, c_23);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_60, c_17);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_60, c_10);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_61, c_3);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_61, c_28);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_62, c_11);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_62, c_20);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_63, c_11);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_63, c_12);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_64, c_24);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_65, c_5);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_65, c_14);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_66, c_28);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_66, c_5);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_66, c_12);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_67, c_20);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_68, c_16);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_68, c_8);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_68, c_7);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_69, c_24);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_70, c_15);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_71, c_3);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_71, c_10);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_72, c_19);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_72, c_3);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_73, c_14);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_74, c_12);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_75, c_0);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_76, c_19);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_77, c_26);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_77, c_19);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_78, c_19);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_78, c_17);
  INSERT INTO public.dancer_classes (dancer_id, class_id) VALUES (d_79, c_18);

  -- Choreographies
  INSERT INTO public.choreographies (name, duration) VALUES ('REI DO SHOW', '03:27') RETURNING id INTO ch_0;
  INSERT INTO public.choreographies (name, duration) VALUES ('BELA ADORMECIDA', '02:07') RETURNING id INTO ch_1;
  INSERT INTO public.choreographies (name, duration) VALUES ('LILO E STITCH', '04:51') RETURNING id INTO ch_2;
  INSERT INTO public.choreographies (name, duration) VALUES ('SININHO / PETER PAN', '03:48') RETURNING id INTO ch_3;
  INSERT INTO public.choreographies (name, duration) VALUES ('PANTERA COR-DE-ROSA', '02:00') RETURNING id INTO ch_4;
  INSERT INTO public.choreographies (name, duration) VALUES ('BRANCA DE NEVE', '02:41') RETURNING id INTO ch_5;
  INSERT INTO public.choreographies (name, duration) VALUES ('MAÇÃS', '02:18') RETURNING id INTO ch_6;
  INSERT INTO public.choreographies (name, duration) VALUES ('RAINHA MÁ', '05:31') RETURNING id INTO ch_7;
  INSERT INTO public.choreographies (name, duration) VALUES ('TOY STORY', '04:46') RETURNING id INTO ch_8;
  INSERT INTO public.choreographies (name, duration) VALUES ('WOODY', '05:47') RETURNING id INTO ch_9;
  INSERT INTO public.choreographies (name, duration) VALUES ('ALICE NO PAÍS DAS MARAVILHAS', '02:21') RETURNING id INTO ch_10;
  INSERT INTO public.choreographies (name, duration) VALUES ('SE ELA DANÇA, EU DANÇO', '04:30') RETURNING id INTO ch_11;
  INSERT INTO public.choreographies (name, duration) VALUES ('HIGH SCHOOL MUSICAL', '03:03') RETURNING id INTO ch_12;
  INSERT INTO public.choreographies (name, duration) VALUES ('APENAS UMA VEZ', '02:14') RETURNING id INTO ch_13;
  INSERT INTO public.choreographies (name, duration) VALUES ('COMO SE FOSSE A PRIMEIRA VEZ', '04:17') RETURNING id INTO ch_14;
  INSERT INTO public.choreographies (name, duration) VALUES ('SUPER MARIO BROS', '02:33') RETURNING id INTO ch_15;
  INSERT INTO public.choreographies (name, duration) VALUES ('ROCKY BALBOA', '02:45') RETURNING id INTO ch_16;
  INSERT INTO public.choreographies (name, duration) VALUES ('XUXA REQUEBRA', '03:34') RETURNING id INTO ch_17;
  INSERT INTO public.choreographies (name, duration) VALUES ('GUERREIRAS KPOP', '04:07') RETURNING id INTO ch_18;
  INSERT INTO public.choreographies (name, duration) VALUES ('ABRACADABRA', '05:02') RETURNING id INTO ch_19;
  INSERT INTO public.choreographies (name, duration) VALUES ('CHUCKY', '03:57') RETURNING id INTO ch_20;
  INSERT INTO public.choreographies (name, duration) VALUES ('CAVEIRAS', '03:03') RETURNING id INTO ch_21;
  INSERT INTO public.choreographies (name, duration) VALUES ('CORINGA', '04:17') RETURNING id INTO ch_22;
  INSERT INTO public.choreographies (name, duration) VALUES ('CORALINE', '02:05') RETURNING id INTO ch_23;
  INSERT INTO public.choreographies (name, duration) VALUES ('WANDINHA', '03:31') RETURNING id INTO ch_24;
  INSERT INTO public.choreographies (name, duration) VALUES ('PÂNICO', '05:11') RETURNING id INTO ch_25;

  -- Choreography Classes
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_0, c_0);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_1, c_1);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_2, c_2);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_3, c_3);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_4, c_4);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_5, c_5);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_6, c_6);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_7, c_7);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_8, c_8);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_9, c_9);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_8, c_10);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_10, c_11);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_11, c_12);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_12, c_13);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_12, c_14);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_13, c_15);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_14, c_16);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_15, c_17);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_16, c_18);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_17, c_19);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_18, c_20);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_18, c_21);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_19, c_22);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_20, c_23);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_21, c_24);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_22, c_25);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_23, c_26);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_24, c_27);
  INSERT INTO public.choreography_classes (choreography_id, class_id) VALUES (ch_25, c_28);

  -- Choreography Dancers (Pulling from classes automatically for realistic mock)
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_0, dancer_id FROM public.dancer_classes WHERE class_id = c_0
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_1, dancer_id FROM public.dancer_classes WHERE class_id = c_1
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_2, dancer_id FROM public.dancer_classes WHERE class_id = c_2
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_3, dancer_id FROM public.dancer_classes WHERE class_id = c_3
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_4, dancer_id FROM public.dancer_classes WHERE class_id = c_4
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_5, dancer_id FROM public.dancer_classes WHERE class_id = c_5
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_6, dancer_id FROM public.dancer_classes WHERE class_id = c_6
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_7, dancer_id FROM public.dancer_classes WHERE class_id = c_7
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_8, dancer_id FROM public.dancer_classes WHERE class_id = c_8
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_9, dancer_id FROM public.dancer_classes WHERE class_id = c_9
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_8, dancer_id FROM public.dancer_classes WHERE class_id = c_10
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_10, dancer_id FROM public.dancer_classes WHERE class_id = c_11
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_11, dancer_id FROM public.dancer_classes WHERE class_id = c_12
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_12, dancer_id FROM public.dancer_classes WHERE class_id = c_13
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_12, dancer_id FROM public.dancer_classes WHERE class_id = c_14
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_13, dancer_id FROM public.dancer_classes WHERE class_id = c_15
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_14, dancer_id FROM public.dancer_classes WHERE class_id = c_16
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_15, dancer_id FROM public.dancer_classes WHERE class_id = c_17
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_16, dancer_id FROM public.dancer_classes WHERE class_id = c_18
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_17, dancer_id FROM public.dancer_classes WHERE class_id = c_19
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_18, dancer_id FROM public.dancer_classes WHERE class_id = c_20
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_18, dancer_id FROM public.dancer_classes WHERE class_id = c_21
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_19, dancer_id FROM public.dancer_classes WHERE class_id = c_22
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_20, dancer_id FROM public.dancer_classes WHERE class_id = c_23
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_21, dancer_id FROM public.dancer_classes WHERE class_id = c_24
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_22, dancer_id FROM public.dancer_classes WHERE class_id = c_25
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_23, dancer_id FROM public.dancer_classes WHERE class_id = c_26
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_24, dancer_id FROM public.dancer_classes WHERE class_id = c_27
            ON CONFLICT DO NOTHING;
  INSERT INTO public.choreography_dancers (choreography_id, dancer_id)
            SELECT ch_25, dancer_id FROM public.dancer_classes WHERE class_id = c_28
            ON CONFLICT DO NOTHING;
END $$;