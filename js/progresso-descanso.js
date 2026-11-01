/* Progresso corporal e descanso por série. Funciona sem servidor. */
(() => {
  'use strict';
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const REGIONS = {peito:'Peito',costas:'Costas',trapezio:'Trapézio',lombar:'Lombar',ombros:'Ombros',biceps:'Bíceps',triceps:'Tríceps',antebracos:'Antebraços',abdomen:'Abdominais',obliquos:'Oblíquos',quadriceps:'Quadríceps',posteriores:'Posteriores',gluteos:'Glúteos',gemeos:'Gémeos'};
  // Nomes usados no campo «musculos» do catálogo. A primeira regra que corresponde ganha.
  const MUSCLE_RULES = [
    [/peitoral/,'peito'],[/deltoide/,'ombros'],[/tricep/,'triceps'],[/bicep|braquial/,'biceps'],
    [/antebraco/,'antebracos'],[/obliquo/,'obliquos'],[/core|abdomin/,'abdomen'],
    [/dorsai|costas|romboide/,'costas'],[/trapezio/,'trapezio'],[/eretor|lombar/,'lombar'],
    [/glute|abdutor/,'gluteos'],[/gemeo|soleo/,'gemeos'],[/posterior/,'posteriores'],[/quadricep|^pernas$/,'quadriceps'],
    [/^bracos$/,'biceps']
  ];
  // Exercícios fora do catálogo (peso livre, personalizados): o músculo principal. A ordem importa.
  const NAME_RULES = [
    [/gemeo|panturrilha|calf|flexao plantar/,'gemeos'],
    [/isquio|flexora|flexao de pernas|leg curl|stiff|romeno/,'posteriores'],
    [/peso morto/,'gluteos'],
    [/extensao de (quadricep|pernas)|extensora/,'quadriceps'],
    [/elevacao pelvica|hip thrust|kickback|coice|abducao|abdut/,'gluteos'],
    [/agachamento|leg press|lunge|afundo|bulgaro|aducao/,'quadriceps'],
    [/supino|chest press/,'peito'],
    [/crucifixo invertido|face pull/,'ombros'],
    [/crucifixo|peck.deck|fly/,'peito'],
    [/puxada|lat pull|barra fixa/,'costas'],
    [/encolhimento|shrug/,'trapezio'],
    [/remada|remo/,'costas'],
    [/hiperextens|lombar/,'lombar'],
    [/elevacao (lateral|frontal)/,'ombros'],
    [/press.*ombro|prensa.*ombro|desenvolvimento/,'ombros'],
    [/tricep|frances|pushdown|fundos/,'triceps'],
    [/antebraco|punho/,'antebracos'],
    [/rosca|bicep|curl/,'biceps'],
    [/obliqu/,'obliquos'],
    [/abdominal|crunch|prancha|ab wheel/,'abdomen'],
    [/caminhada|corrida|passadeira|eliptica|bicicleta/,'quadriceps']
  ];
  const GROUP_REGIONS = {peito:['peito'],costas:['costas'],ombros:['ombros'],bracos:['biceps','triceps'],pernas:['quadriceps','posteriores','gluteos','gemeos'],gluteos:['gluteos'],core:['abdomen','obliquos']};
  let catalog=null;
  function catalogMuscles(nome){
    if(!catalog){
      catalog=new Map();
      const sources=[typeof EQUIPAMENTOS_EXERCICIOS!=='undefined'?EQUIPAMENTOS_EXERCICIOS:{},typeof EXERCICIOS_EXTRA!=='undefined'?EXERCICIOS_EXTRA:{}];
      sources.forEach(source=>Object.values(source).flat().forEach(item=>{
        if(item?.musculos&&!catalog.has(norm(item.nome)))catalog.set(norm(item.nome),item.musculos);
      }));
    }
    return catalog.get(norm(nome));
  }
  // Cada exercício pinta só o músculo principal. Sem nome conhecido, um grupo genérico (Pernas, Braços) pinta o grupo.
  function regionsFor(ex){
    const listed=catalogMuscles(ex?.nome);
    if(listed)for(const m of listed){const rule=MUSCLE_RULES.find(([re])=>re.test(norm(m)));if(rule)return [rule[1]];}
    const nome=norm(ex?.nome);
    const rule=NAME_RULES.find(([re])=>re.test(nome));
    return rule?[rule[1]]:GROUP_REGIONS[norm(ex?.grupo)]||[];
  }
  // Ilustrações detalhadas extraídas da referência enviada, com fundos transparentes.
  // Cada caminho SVG usa a coordenada REAL da ilustração e está mascarado
  // pelo alfa da silhueta: nenhuma cor pode ultrapassar o músculo desenhado.
  const anatomia = {
    anterior: { x:48, y:9, w:499, h:803, src:'images/progress/corpo-anterior-detalhado.png',
      parts: {
        peito: [
          'M297 205 Q297 189 282 184 Q268 179 254 177 Q240 175 232 183 Q225 191 220 200 Q214 209 214 218 Q213 226 223 232 Q233 239 250 242 Q268 245 279 240 Q290 236 294 228 Q297 221 297 205 Z',
          'M300 205 Q300 221 304 228 Q307 236 318 240 Q329 245 346 242 Q364 239 374 232 Q384 226 384 218 Q383 209 378 200 Q372 191 364 183 Q357 175 343 177 Q329 179 314 184 Q300 189 300 205 Z'
        ],
        ombros: [
          'M232 182 Q240 174 228 172 Q215 170 202 174 Q190 179 182 189 Q174 199 171 210 Q168 221 169 231 Q170 241 179 238 Q188 234 196 228 Q205 221 210 215 Q214 209 220 200 Q225 191 232 182 Z',
          'M364 182 Q372 191 378 200 Q383 209 388 215 Q392 221 400 228 Q409 234 418 238 Q427 241 428 231 Q429 221 426 210 Q423 199 415 189 Q407 179 394 174 Q382 170 370 172 Q357 174 364 182 Z'
        ],
        trapezio: [
          'M275 140 Q272 136 258 150 Q243 164 240 167 Q236 170 249 171 Q262 172 270 170 Q278 168 278 156 Q278 145 275 140 Z',
          'M322 140 Q319 145 319 156 Q319 168 327 170 Q335 172 348 171 Q361 170 358 167 Q354 164 340 150 Q325 136 322 140 Z'
        ],
        biceps: [
          'M182 240 Q192 235 194 243 Q197 251 195 262 Q193 274 186 286 Q180 299 172 310 Q163 321 158 316 Q154 311 156 300 Q158 289 162 276 Q167 264 170 254 Q173 245 182 240 Z',
          'M414 240 Q424 245 427 254 Q430 264 434 276 Q439 289 441 300 Q443 311 438 316 Q434 321 426 310 Q417 299 410 286 Q404 274 402 262 Q400 251 402 243 Q405 235 414 240 Z'
        ],
        triceps: [
          'M162 248 Q170 245 166 254 Q163 264 158 276 Q154 289 148 298 Q143 308 141 301 Q139 294 141 282 Q143 270 148 260 Q153 251 162 248 Z',
          'M436 248 Q444 251 449 260 Q454 270 456 282 Q458 294 456 301 Q454 308 448 298 Q443 289 438 276 Q434 264 430 254 Q427 245 436 248 Z'
        ],
        antebracos: [
          'M132 315 Q140 309 148 316 Q157 323 168 322 Q178 320 180 322 Q182 325 172 340 Q163 355 153 370 Q143 384 132 398 Q120 411 108 408 Q95 406 96 395 Q98 384 106 366 Q113 349 119 335 Q125 321 132 315 Z',
          'M464 315 Q472 321 478 335 Q484 349 492 366 Q499 384 500 395 Q502 406 490 408 Q477 411 466 398 Q454 384 444 370 Q434 355 424 340 Q415 325 417 322 Q419 320 430 322 Q440 323 448 316 Q457 309 464 315 Z'
        ],
        abdomen: [
          'M267 260 Q267 246 280 246 Q294 246 294 258 Q294 270 280 272 Q267 274 267 260 Z',
          'M330 260 Q330 274 316 272 Q303 270 303 258 Q303 246 316 246 Q330 246 330 260 Z',
          'M265 297 Q265 281 280 281 Q294 281 294 295 Q294 309 280 311 Q265 313 265 297 Z',
          'M332 297 Q332 313 318 311 Q303 309 303 295 Q303 281 318 281 Q332 281 332 297 Z',
          'M266 334 Q265 318 280 318 Q294 318 294 334 Q294 350 281 350 Q268 350 266 334 Z',
          'M330 334 Q329 350 316 350 Q303 350 303 334 Q303 318 318 318 Q332 318 330 334 Z',
          'M267 374 Q266 353 280 353 Q295 353 296 377 Q296 401 282 398 Q268 396 267 374 Z',
          'M330 374 Q329 396 315 398 Q301 401 302 377 Q302 353 316 353 Q331 353 330 374 Z'
        ],
        obliquos: [
          'M228 276 Q228 259 244 262 Q260 264 261 286 Q262 309 263 332 Q264 354 265 373 Q266 392 249 382 Q232 371 229 355 Q226 339 226 316 Q227 294 228 276 Z',
          'M370 276 Q370 294 370 316 Q371 339 368 355 Q365 371 348 382 Q331 392 332 373 Q333 354 334 332 Q335 309 336 286 Q337 264 353 262 Q369 259 370 276 Z'
        ],
        quadriceps: [
          'M210 422 Q215 409 222 404 Q230 398 240 400 Q250 403 256 416 Q262 429 264 446 Q267 464 266 484 Q265 504 260 528 Q254 551 248 553 Q243 555 236 553 Q230 551 224 548 Q218 546 211 530 Q204 514 202 494 Q199 474 202 454 Q205 434 210 422 Z',
          'M379 422 Q384 434 387 454 Q390 474 388 494 Q385 514 378 530 Q371 546 365 548 Q359 551 352 553 Q346 555 340 553 Q335 551 330 528 Q324 504 323 484 Q322 464 324 446 Q327 429 333 416 Q339 403 349 400 Q359 398 366 404 Q374 409 379 422 Z'
        ],
        gemeos: [
          'M200 619 Q204 604 210 602 Q215 599 218 619 Q220 639 220 659 Q220 679 215 689 Q210 699 204 684 Q199 669 197 652 Q195 634 200 619 Z',
          'M390 619 Q394 634 392 652 Q390 669 384 684 Q379 699 374 689 Q369 679 369 659 Q369 639 372 619 Q374 599 380 602 Q385 604 390 619 Z',
          'M244 622 Q245 606 250 604 Q255 601 259 615 Q263 629 262 644 Q260 659 255 674 Q250 689 246 684 Q243 679 243 659 Q243 639 244 622 Z',
          'M345 622 Q346 639 346 659 Q346 679 342 684 Q339 689 334 674 Q329 659 328 644 Q326 629 330 615 Q334 601 339 604 Q344 606 345 622 Z'
        ]
      }
    },
    posterior: { x:709, y:9, w:473, h:803, src:'images/progress/corpo-posterior-detalhado.png',
      parts: {
        trapezio: [
          'M941 148 Q934 126 922 136 Q909 146 892 154 Q876 161 880 170 Q884 179 896 192 Q909 204 919 216 Q929 229 938 240 Q948 251 948 210 Q948 169 941 148 Z',
          'M956 148 Q949 169 949 210 Q949 251 958 240 Q968 229 978 216 Q988 204 1000 192 Q1013 179 1017 170 Q1021 161 1004 154 Q988 146 976 136 Q963 126 956 148 Z'
        ],
        costas: [
          'M898 195 Q886 184 880 195 Q874 206 870 218 Q865 231 865 245 Q865 259 868 275 Q871 291 878 305 Q884 319 896 312 Q909 304 925 290 Q941 276 944 266 Q948 255 938 243 Q929 231 919 218 Q909 206 898 195 Z',
          'M1000 195 Q988 206 978 218 Q968 231 958 243 Q949 255 952 266 Q956 276 972 290 Q988 304 1000 312 Q1013 319 1020 305 Q1026 291 1029 275 Q1032 259 1032 245 Q1032 231 1028 218 Q1023 206 1017 195 Q1011 184 1000 195 Z'
        ],
        lombar: [
          'M948 320 Q948 261 944 270 Q941 279 926 292 Q911 306 906 315 Q901 324 908 339 Q916 354 926 364 Q936 374 942 376 Q949 379 948 320 Z',
          'M948 320 Q948 379 954 376 Q961 374 971 364 Q981 354 988 339 Q996 324 991 315 Q986 306 971 292 Q956 279 952 270 Q949 261 948 320 Z'
        ],
        ombros: [
          'M869 169 Q864 164 850 168 Q836 171 830 182 Q824 194 825 208 Q826 221 831 225 Q836 229 850 222 Q864 214 870 206 Q876 199 875 186 Q874 174 869 169 Z',
          'M1028 169 Q1023 174 1022 186 Q1021 199 1027 206 Q1033 214 1047 222 Q1061 229 1066 225 Q1071 221 1072 208 Q1073 194 1067 182 Q1061 171 1047 168 Q1033 164 1028 169 Z'
        ],
        triceps: [
          'M825 240 Q836 230 848 232 Q861 233 860 248 Q859 264 852 280 Q844 296 832 310 Q819 325 815 314 Q811 304 810 289 Q809 274 812 262 Q814 249 825 240 Z',
          'M1072 240 Q1083 249 1086 262 Q1088 274 1087 289 Q1086 304 1082 314 Q1078 325 1066 310 Q1053 296 1046 280 Q1038 264 1037 248 Q1036 233 1048 232 Q1061 230 1072 240 Z'
        ],
        antebracos: [
          'M786 330 Q794 316 805 321 Q816 326 826 328 Q836 331 831 345 Q826 359 820 374 Q814 389 802 409 Q791 429 776 425 Q761 421 764 405 Q766 389 772 366 Q779 344 786 330 Z',
          'M1110 330 Q1118 344 1124 366 Q1131 389 1134 405 Q1136 421 1121 425 Q1106 429 1094 409 Q1083 389 1077 374 Q1071 359 1066 345 Q1061 331 1071 328 Q1081 326 1092 321 Q1103 316 1110 330 Z'
        ],
        gluteos: [
          'M880 408 Q883 399 892 395 Q901 391 914 394 Q926 396 935 402 Q944 409 946 419 Q948 429 946 438 Q944 446 934 448 Q924 451 912 450 Q899 448 890 441 Q881 434 878 425 Q876 416 880 408 Z',
          'M1016 408 Q1019 416 1016 425 Q1014 434 1005 441 Q996 448 984 450 Q971 451 961 448 Q951 446 949 438 Q947 429 949 419 Q951 409 960 402 Q969 396 982 394 Q994 391 1003 395 Q1012 399 1016 408 Z'
        ],
        posteriores: [
          'M868 485 Q874 466 889 460 Q904 454 918 455 Q931 456 934 462 Q936 469 931 492 Q926 514 918 540 Q911 566 908 570 Q904 574 892 572 Q879 571 874 555 Q869 539 865 522 Q861 504 868 485 Z',
          'M1024 485 Q1030 504 1026 522 Q1022 539 1017 555 Q1012 571 1000 572 Q987 574 984 570 Q980 566 972 540 Q965 514 960 492 Q955 469 958 462 Q960 456 974 455 Q987 454 1002 460 Q1017 466 1024 485 Z'
        ],
        gemeos: [
          'M875 605 Q866 606 860 618 Q854 629 852 642 Q850 654 854 666 Q859 679 868 678 Q876 678 881 678 Q886 679 894 675 Q903 671 906 658 Q908 644 904 629 Q901 614 892 609 Q884 604 875 605 Z',
          'M1016 605 Q1007 604 998 609 Q990 614 986 629 Q983 644 986 658 Q988 671 996 675 Q1005 679 1010 678 Q1015 678 1024 678 Q1032 679 1036 666 Q1041 654 1039 642 Q1037 629 1031 618 Q1025 606 1016 605 Z'
        ]
      }
    }
  };
  // Mesma ilustração com as proporções ajustadas; os caminhos seguem a mesma deformação.
  const anatomiaFeminina = {
    anterior: { x:48, y:9, w:499, h:803, src:'images/progress/corpo-anterior-feminino.png',
      parts: {peito:["M293 220 Q293 192 282 188 Q272 185 262 184 Q251 183 246 191 Q240 199 236 210 Q232 221 231 231 Q230 241 233 250 Q236 259 242 265 Q249 271 259 272 Q269 274 278 270 Q286 265 290 256 Q293 247 293 220 Z", "M300 220 Q300 247 304 256 Q307 265 316 270 Q324 274 334 272 Q344 271 350 265 Q357 259 360 250 Q363 241 362 231 Q361 221 357 210 Q353 199 348 191 Q342 183 332 184 Q321 185 310 188 Q300 192 300 220 Z"],
        ombros:["M246 184 Q253 175 243 174 Q233 172 221 176 Q209 181 202 191 Q194 201 191 212 Q188 223 189 233 Q190 243 198 240 Q206 236 214 230 Q222 223 226 217 Q230 211 235 202 Q240 193 246 184 Z", "M349 184 Q356 193 362 202 Q366 211 371 217 Q375 223 382 230 Q390 236 399 240 Q406 243 408 233 Q408 223 406 212 Q403 201 395 191 Q387 181 375 176 Q364 172 353 174 Q343 176 349 184 Z"],
        trapezio:["M279 141 Q277 137 266 151 Q255 165 253 169 Q250 172 260 172 Q270 173 276 171 Q282 168 282 157 Q282 146 279 141 Z", "M317 141 Q314 146 314 157 Q314 169 320 171 Q326 173 336 172 Q346 172 344 169 Q341 166 330 151 Q319 137 317 141 Z"],
        biceps:["M201 242 Q210 237 211 245 Q214 253 211 264 Q209 276 203 288 Q198 301 192 312 Q185 323 182 318 Q180 313 181 302 Q183 291 185 278 Q188 266 190 256 Q193 247 201 242 Z", "M395 242 Q404 247 406 256 Q408 266 410 278 Q413 291 414 302 Q416 313 413 318 Q410 323 404 312 Q397 301 392 288 Q387 276 385 264 Q383 253 384 245 Q387 237 395 242 Z"],
        triceps:["M183 250 Q190 247 187 256 Q185 266 182 278 Q180 291 176 300 Q172 310 170 303 Q169 296 170 284 Q170 272 173 262 Q176 253 183 250 Z", "M414 250 Q420 253 423 262 Q426 272 426 284 Q427 296 426 303 Q424 310 419 300 Q416 291 413 278 Q411 266 409 256 Q406 247 414 250 Z"],
        antebracos:["M163 317 Q169 311 175 318 Q181 325 189 324 Q197 322 198 324 Q200 327 191 342 Q183 357 174 372 Q166 386 157 400 Q147 413 137 410 Q126 408 128 397 Q132 386 141 368 Q147 351 152 337 Q157 323 163 317 Z", "M432 317 Q439 323 444 337 Q449 351 457 368 Q465 386 467 397 Q470 408 460 410 Q449 413 440 400 Q430 386 421 372 Q413 357 404 342 Q396 327 398 324 Q399 322 407 324 Q415 325 420 318 Q427 311 432 317 Z"],
        abdomen:["M269 297 Q269 281 282 281 Q294 281 294 295 Q294 309 282 311 Q270 313 269 297 Z", "M327 297 Q326 313 315 311 Q302 309 302 295 Q302 281 315 281 Q328 281 327 297 Z", "M271 334 Q270 318 282 318 Q294 318 294 334 Q294 350 283 350 Q272 350 271 334 Z", "M324 334 Q324 350 313 350 Q302 350 302 334 Q302 318 315 318 Q326 318 324 334 Z", "M270 374 Q271 353 282 353 Q295 353 296 377 Q296 401 282 398 Q269 396 270 374 Z", "M327 374 Q328 396 315 398 Q301 401 301 377 Q301 353 313 353 Q325 353 327 374 Z"],
        obliquos:["M238 290 Q238 290 250 290 Q264 290 266 290 Q267 309 269 332 Q269 354 268 373 Q267 392 252 382 Q239 371 240 355 Q239 339 238 316 Q237 296 238 290 Z", "M359 290 Q359 296 357 316 Q358 339 356 355 Q357 371 344 382 Q330 392 328 373 Q327 354 327 332 Q329 309 331 290 Q332 290 345 290 Q358 290 359 290 Z"],
        quadriceps:["M210 422 Q215 409 222 404 Q231 398 241 400 Q250 403 255 416 Q261 429 263 446 Q267 464 267 484 Q267 504 262 528 Q256 551 250 553 Q245 555 238 553 Q232 551 226 548 Q221 546 213 530 Q205 514 203 494 Q199 474 201 454 Q205 434 210 422 Z", "M380 422 Q385 434 388 454 Q391 474 388 494 Q384 514 376 530 Q369 546 363 548 Q357 551 350 553 Q344 555 338 553 Q334 551 328 528 Q322 504 322 484 Q322 464 325 446 Q328 429 334 416 Q339 403 348 400 Q358 398 366 404 Q374 409 380 422 Z"],
        gemeos:["M213 619 Q213 604 217 602 Q221 599 226 619 Q230 639 231 659 Q231 679 228 689 Q226 699 221 684 Q216 669 213 652 Q210 634 213 619 Z", "M378 619 Q380 634 377 652 Q374 669 369 684 Q365 699 362 689 Q358 679 359 659 Q360 639 364 619 Q368 599 373 602 Q377 604 378 619 Z", "M248 622 Q249 606 253 604 Q258 601 262 615 Q265 629 264 644 Q263 659 258 674 Q253 689 250 684 Q248 679 248 659 Q248 639 248 622 Z", "M341 622 Q342 639 341 659 Q341 679 338 684 Q336 689 331 674 Q327 659 326 644 Q324 629 328 615 Q331 601 336 604 Q340 606 341 622 Z"]}
    },
    posterior: { x:709, y:9, w:473, h:803, src:'images/progress/corpo-posterior-feminino.png',
      parts: {trapezio:["M942 149 Q936 126 927 137 Q917 147 904 156 Q892 163 895 172 Q898 181 907 193 Q916 204 923 216 Q931 229 939 240 Q948 251 948 210 Q948 169 942 149 Z", "M954 149 Q948 169 949 210 Q949 251 957 240 Q966 229 973 216 Q980 204 989 193 Q998 181 1001 172 Q1005 163 991 156 Q979 147 970 137 Q960 126 954 149 Z"],
        costas:["M908 196 Q899 185 894 196 Q888 207 884 220 Q880 233 879 247 Q878 261 880 277 Q882 293 889 306 Q895 319 905 312 Q915 304 928 290 Q942 276 944 266 Q948 255 939 243 Q931 231 923 218 Q916 206 908 196 Z", "M989 196 Q980 206 973 218 Q966 231 957 243 Q949 255 952 266 Q955 276 969 290 Q981 304 991 312 Q1001 319 1008 306 Q1014 293 1017 277 Q1018 261 1017 247 Q1016 233 1013 220 Q1008 208 1002 197 Q997 186 989 196 Z"],
        lombar:["M948 320 Q948 261 944 270 Q942 279 929 292 Q917 306 913 315 Q909 324 915 339 Q921 354 929 364 Q937 374 942 376 Q949 379 948 320 Z", "M948 320 Q948 379 953 376 Q960 374 968 364 Q976 354 980 339 Q987 324 983 315 Q980 306 968 292 Q955 279 951 270 Q949 261 948 320 Z"],
        ombros:["M886 171 Q882 166 869 170 Q855 173 850 184 Q844 196 845 210 Q845 223 850 227 Q854 231 867 224 Q880 216 885 208 Q890 200 891 188 Q890 176 886 171 Z", "M1010 171 Q1006 176 1006 188 Q1006 201 1011 208 Q1017 216 1029 224 Q1042 231 1047 227 Q1051 223 1052 210 Q1053 196 1047 184 Q1041 173 1028 170 Q1015 166 1010 171 Z"],
        triceps:["M844 242 Q854 232 865 234 Q876 235 875 250 Q873 266 866 282 Q859 298 850 312 Q840 327 837 316 Q835 306 834 291 Q833 276 834 264 Q835 251 844 242 Z", "M1052 242 Q1061 251 1063 264 Q1063 276 1061 291 Q1061 306 1058 316 Q1056 327 1047 312 Q1037 298 1031 282 Q1024 266 1021 250 Q1020 235 1030 234 Q1042 232 1052 242 Z"],
        antebracos:["M815 332 Q822 318 830 323 Q837 328 845 330 Q853 333 848 347 Q842 361 836 376 Q830 391 819 411 Q810 431 800 427 Q789 423 793 407 Q796 391 803 368 Q810 346 815 332 Z", "M1080 332 Q1086 346 1092 368 Q1100 391 1105 407 Q1107 423 1096 427 Q1085 431 1076 411 Q1066 391 1060 376 Q1054 361 1049 347 Q1043 333 1051 330 Q1058 328 1066 323 Q1074 318 1080 332 Z"],
        gluteos:["M879 408 Q884 399 893 395 Q903 391 915 394 Q926 396 935 402 Q944 409 946 419 Q948 429 946 438 Q944 446 934 448 Q923 451 911 450 Q897 448 887 441 Q878 434 876 425 Q875 416 879 408 Z", "M1016 408 Q1020 416 1018 425 Q1017 434 1008 441 Q998 448 986 450 Q972 451 961 448 Q951 446 949 438 Q947 429 949 419 Q951 409 960 402 Q968 396 981 394 Q992 391 1002 395 Q1011 399 1016 408 Z"],
        posteriores:["M867 485 Q872 466 887 460 Q902 454 917 455 Q931 456 934 462 Q936 469 933 492 Q928 514 920 540 Q913 566 910 570 Q906 574 895 572 Q882 571 877 555 Q871 539 866 522 Q861 504 867 485 Z", "M1025 485 Q1030 504 1025 522 Q1020 539 1014 555 Q1009 571 997 572 Q985 574 982 570 Q979 566 971 540 Q963 514 958 492 Q955 469 958 462 Q960 456 975 455 Q989 454 1004 460 Q1019 466 1025 485 Z"],
        gemeos:["M881 605 Q873 606 870 618 Q867 629 866 642 Q865 654 869 666 Q874 679 880 678 Q886 678 889 678 Q893 679 899 675 Q907 671 909 658 Q911 644 907 629 Q904 614 896 609 Q889 604 881 605 Z", "M1011 605 Q1003 604 994 609 Q987 614 983 629 Q980 644 983 658 Q985 671 991 675 Q998 679 1002 678 Q1006 678 1012 678 Q1018 679 1021 666 Q1026 654 1025 642 Q1025 629 1021 618 Q1018 606 1011 605 Z"]}
    }
  };
  function getTargets(){
    const series={};
    const plans=typeof treinos!=='undefined'?treinos:{};
    Object.values(plans||{}).forEach(day=>(Array.isArray(day)?day:[]).forEach(workout=>(workout.exercicios||[]).forEach(ex=>{
      const n=Array.isArray(ex.seriesData)&&ex.seriesData.length?ex.seriesData.length:Math.max(1,Number(ex.series)||1);
      regionsFor(ex).forEach(region=>{series[region]=(series[region]||0)+n;});
    })));
    return series;
  }
  function body(view,weight,highest){
    const data=(corpo==='feminino'?anatomiaFeminina:anatomia)[view];
    const bodySvg=Object.entries(data.parts).map(([key,segments])=>{
      const amount=weight[key]||0;if(!amount)return '';
      const opacity=(.5+.5*amount/highest).toFixed(3);
      return `<g class="gym-muscle-region" data-muscle="${key}" opacity="${opacity}">${segments.map(shape=>`<path d="${shape}"/>`).join('')}</g>`;
    }).join('');
    return `<div class="gym-anatomy-layers detailed-anatomy" role="img" aria-label="Vista ${view} — músculos alvo dos teus treinos a roxo">
      <img class="gym-anatomy-neutral" src="${data.src}" alt="" loading="eager" decoding="sync" draggable="false" />
      <svg class="gym-anatomy-overlay" aria-hidden="true" viewBox="${data.x} ${data.y} ${data.w} ${data.h}" preserveAspectRatio="none" style="-webkit-mask-image:url('${data.src}');mask-image:url('${data.src}')">${bodySvg}</svg>
    </div>`;
  }
  // As ilustrações ficam em memória para o mapa aparecer logo ao abrir a página.
  [anatomia,anatomiaFeminina].forEach(figura=>Object.values(figura).forEach(view=>{new Image().src=view.src;}));
  let ultimoMapa=null;
  function renderProgress(){
    const root=document.getElementById('gymProgressBody');if(!root)return;
    const series=getTargets(),weight=series;
    const assinatura=corpo+JSON.stringify(series);
    if(assinatura===ultimoMapa&&root.firstChild)return;
    ultimoMapa=assinatura;
    const targets=Object.keys(weight).sort((a,b)=>weight[b]-weight[a]);
    const highest=Math.max(1,...Object.values(weight)),mostSeries=Math.max(1,...Object.values(series));
    root.innerHTML=`<div class="gym-body-switch" role="group" aria-label="Figura do corpo">${[['masculino','Masculino'],['feminino','Feminino']].map(([valor,texto])=>`<button type="button" data-corpo="${valor}" aria-pressed="${corpo===valor}">${texto}</button>`).join('')}</div>
    <div class="gym-progress-grid">
      <div class="gym-body-card">${body('anterior',weight,highest)}<strong>Vista anterior</strong></div>
      <div class="gym-body-card">${body('posterior',weight,highest)}<strong>Vista posterior</strong></div>
      <div class="gym-progress-totals"><strong>Músculos alvo</strong>${targets.length?targets.map(k=>`<div class="gym-progress-line"><b>${REGIONS[k]}</b><span class="track"><span class="fill" style="width:${Math.round(100*series[k]/mostSeries)}%"></span></span><em>${series[k]} ${series[k]===1?'série':'séries'}</em></div>`).join(''):'<p class="gym-progress-empty">Adiciona exercícios para veres os músculos alvo.</p>'}</div>
    </div>`;
  }
  // Descanso geral + descansos entre séries: relógios independentes.
  // Todos calculam pelo horário absoluto, não pelo número de ticks, para evitar
  // atrasos do contador quando o navegador está em segundo plano.
  const REST_DEFAULT_KEY = 'vf_workout_default_rest_seconds_v1';
  const GENERAL_STATE_KEY = 'vf_workout_general_rest_v1';
  const choices = Array.from({length:20},(_,i)=>(i+1)*15); // 00:15 a 05:00
  const MIN_SECONDS = 1, MAX_SECONDS_MINUTES = 60, MAX_SECONDS = MAX_SECONDS_MINUTES * 60; // o servidor só agenda alertas até 60 min
  const validSeconds = value => Number.isInteger(Number(value)) && Number(value) >= MIN_SECONDS && Number(value) <= MAX_SECONDS;
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
  // A <select> guarda a escolha; o relógio por cima mostra o tempo a correr.
  function syncSlot(row,seconds){
    const select=row?.querySelector('.gym-rest-select');if(!select)return;
    const values=[...new Set([...choices,...customTimes,seconds])].sort((a,b)=>a-b);
    select.innerHTML=values.map(v=>`<option value="${v}"${customTimes.includes(v)?' data-removivel':''}>${fmt(v)}</option>`).join('')+'<option value="custom">Personalizado…</option>';
    select.value=String(seconds);
  }
  const readJson = key => { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } };
  const storage = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };
  let defaultSeconds = Number(readJson(REST_DEFAULT_KEY));
  if (!validSeconds(defaultSeconds)) defaultSeconds = 90;
  // Tempos criados pelo utilizador. Um padrão antigo fora da lista passa a ser um deles, para se poder apagar.
  const CUSTOM_TIMES_KEY = 'vf_rest_custom_times_v1';
  const temposGuardados = readJson(CUSTOM_TIMES_KEY);
  let customTimes = (Array.isArray(temposGuardados) ? temposGuardados : []).map(Number).filter(validSeconds);
  if (!choices.includes(defaultSeconds) && !customTimes.includes(defaultSeconds)) customTimes.push(defaultSeconds);
  const BODY_KEY = 'vf_progresso_corpo_v1';
  let corpo = readJson(BODY_KEY)==='feminino'?'feminino':'masculino';
  const fmt = n => `${String(Math.floor(Math.max(0,n)/60)).padStart(2,'0')}:${String(Math.max(0,n)%60).padStart(2,'0')}`;

  let general = {duration:defaultSeconds, remaining:defaultSeconds, running:false, paused:false, deadline:0};
  const previous = readJson(GENERAL_STATE_KEY);
  if (previous && validSeconds(previous.duration)) {
    general.duration=Number(previous.duration);
    if (previous.running && Number.isFinite(Number(previous.deadline))) {
      general.deadline=Number(previous.deadline);
      general.remaining=Math.max(0,Math.ceil((general.deadline-Date.now())/1000));
      general.running=general.remaining>0;general.paused=false;
      // Terminou com a app fechada: fica pronto a recomeçar, como quando termina com ela aberta.
      if(!general.running){general.remaining=general.duration;general.deadline=0;}
    } else {
      general.remaining=Math.min(general.duration,Number(previous.remaining)||general.duration);
      general.paused=Boolean(previous.paused);
    }
  }
  let gap = {el:null,duration:defaultSeconds,remaining:defaultSeconds,running:false,paused:false,deadline:0};
  let ticker=null;
  let audioCtx=null;
  let audioUnlocked=false;
  let toastTimer=null;
  let toastToken=0;
  const getGlobal = id => document.getElementById(id);
  const alerts=()=>window.TimerBackgroundAlerts;

  function saveGeneral(){storage(GENERAL_STATE_KEY,general);}
  function cancelPush(kind){
    try {Promise.resolve(alerts()?.cancelNamed?.(kind)).catch(()=>{});}catch(_){}
  }
  function schedulePush(kind,deadline){
    try {Promise.resolve(alerts()?.scheduleNamed?.(kind,deadline)).catch(()=>{});}catch(_){}
  }
  function ensureAudio(){
    if(!audioCtx){const Class=window.AudioContext||window.webkitAudioContext; if(Class)try{audioCtx=new Class();}catch(_){}}
    if(audioCtx&&audioCtx.state!=='running') audioCtx.resume().catch(()=>{});
    // O iOS só desbloqueia o áudio se um som começar durante um toque: basta um instante de silêncio.
    if(audioCtx&&!audioUnlocked){
      try{
        const silence=audioCtx.createBufferSource();
        silence.buffer=audioCtx.createBuffer(1,1,22050);
        silence.connect(audioCtx.destination);silence.start(0);
        audioUnlocked=true;
      }catch(_){}
    }
  }
  function soundForThreeSeconds(){
    if(!audioCtx || audioCtx.state==='closed') return;
    if(audioCtx.state!=='running') audioCtx.resume().catch(()=>{});
    // Por defeito, o botão de silêncio do iPhone cala este áudio; «transient» toca na mesma sem parar a música.
    try{
      if(navigator.audioSession){
        navigator.audioSession.type='transient';
        setTimeout(()=>{try{navigator.audioSession.type='auto';}catch(_){}},3200);
      }
    }catch(_){}
    const start=audioCtx.currentTime+.03;
    // Sininho de 3 segundos: o badalo alterna entre dois tons agudos, com parciais
    // não harmónicos para o brilho metálico, e o último toque fica a ressoar.
    try {
      const end=start+3;
      const master=audioCtx.createGain();
      master.gain.setValueAtTime(2.5,start);
      master.gain.setValueAtTime(2.5,end-.25);
      master.gain.exponentialRampToValueAtTime(.0001,end);
      master.connect(audioCtx.destination);
      for(let strike=0;strike<16;strike++){
        const at=start+strike*.16,note=strike%2?2637:2093,level=strike%2?.8:1;
        const ring=strike===15?end-at:.55;
        for(const [ratio,peak,decay] of [[1,.12,1],[2.76,.035,.45],[5.4,.012,.2]]){
          const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
          const stop=Math.min(end,at+ring*decay);
          osc.frequency.value=note*ratio;
          gain.gain.setValueAtTime(.0001,at);
          gain.gain.exponentialRampToValueAtTime(peak*level,at+.004);
          gain.gain.exponentialRampToValueAtTime(.0001,stop);
          osc.connect(gain);gain.connect(master);
          osc.start(at);osc.stop(stop);
          osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch(_){}};
        }
      }
      setTimeout(()=>{try{master.disconnect();}catch(_){}},3200);
    }catch(_){}
  }
  const ICONES_TOAST = {
    descanso: '<svg class="vf-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
    feito: '<svg class="vf-i" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    fim: '<svg class="vf-i" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8Z"/></svg>'
  };
  function showRestToast(kind){
    showToast(ICONES_TOAST.descanso,kind==='geral'?'Descanso geral terminado':'Descanso entre séries terminado','Está na hora de retomar o treino.');
  }
  // Conta o que está marcado no ecrã.
  function showEncouragement(button){
    const pending=root=>root.querySelector('.gym-series-complete[aria-pressed="false"]');
    const left=(n,one,many)=>`${n===1?`Está quase, continua: falta 1 ${one}`:`Continua: faltam ${n} ${many}`}.`;
    const exercise=button.closest('.exercise-card'),workout=button.closest('.workout-group-card');
    if(!exercise||!workout)return;
    const seriesLeft=exercise.querySelectorAll('.gym-series-complete[aria-pressed="false"]').length;
    const exercisesLeft=[...workout.querySelectorAll('.exercise-card')].filter(pending).length;
    if(seriesLeft)showToast(ICONES_TOAST.feito,'Bom trabalho!',left(seriesLeft,'série','séries'));
    else if(exercisesLeft)showToast(ICONES_TOAST.feito,'Exercício concluído, bom trabalho!',left(exercisesLeft,'exercício','exercícios'));
    else showToast(ICONES_TOAST.fim,'Treino concluído!','Excelente trabalho, foste até ao fim.');
  }
  function showToast(icon,title,text){
    const toast=getGlobal('gymRestCompleteToast');if(!toast)return;
    getGlobal('gymRestCompleteIcon').innerHTML=icon;
    getGlobal('gymRestCompleteTitle').textContent=title;
    getGlobal('gymRestCompleteText').textContent=text;
    toast.hidden=false;
    toast.classList.remove('is-showing');
    void toast.offsetWidth;
    toast.classList.add('is-showing');
    const token=++toastToken;
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{if(token===toastToken)toast.hidden=true;},3000);
  }
  function completeRest(kind){
    if(document.visibilityState==='visible'){
      cancelPush(kind);
      soundForThreeSeconds();
      try{navigator.vibrate?.([250,110,250,110,250]);}catch(_){}
      showRestToast(kind);
    } else {
      // Um push real depende do OneSignal (servidor), de permissão e de a app
      // estar instalada em iOS. Notification() não é um alarme agendável nativo.
      try{alerts()?.notifyNamed?.(kind);}catch(_){}
    }
  }

  // O ícone só é trocado quando muda: refazê-lo a cada tick perderia toques a meio.
  function setPlayButton(button,running,label){
    if(!button||button.dataset.state===label)return;
    button.dataset.state=label;
    button.innerHTML=running?ICON_PAUSE:ICON_PLAY;
    button.setAttribute('aria-label',`${label} descanso`);
  }
  const playLabel=clock=>clock.running?'Pausar':clock.remaining===0?'Recomeçar':clock.paused?'Retomar':'Iniciar';
  function renderGeneral(){
    const clock=getGlobal('gymGeneralClock'), bar=getGlobal('gymGeneralBar');
    if(!clock||!bar)return;
    clock.textContent=fmt(general.remaining);
    bar.style.width=`${Math.max(0,Math.min(100,general.remaining/general.duration*100))}%`;
    setPlayButton(getGlobal('gymGeneralStart'),general.running,playLabel(general));
    getGlobal('gymGeneralRest')?.classList.toggle('is-running',general.running);
    getGlobal('gymGeneralRest')?.classList.toggle('is-finished',general.remaining===0);
  }
  function renderGap(){
    if(!gap.el?.isConnected)return;
    const clock=gap.el.querySelector('.gym-inline-rest-clock');
    const fill=gap.el.querySelector('.gym-inline-rest-fill');
    if(clock)clock.textContent=fmt(gap.remaining);
    if(fill)fill.style.width=`${Math.max(0,Math.min(100,gap.remaining/gap.duration*100))}%`;
    setPlayButton(gap.el.querySelector('.gym-inline-rest-toggle'),gap.running,playLabel(gap));
    gap.el.classList.toggle('is-running',gap.running);
    gap.el.classList.toggle('is-finished',gap.remaining===0);
  }
  function tick(){
    if(general.running){
      general.remaining=Math.max(0,Math.ceil((general.deadline-Date.now())/1000));
      if(general.remaining===0){general.running=false;general.paused=false;general.deadline=0;general.duration=defaultSeconds;general.remaining=defaultSeconds;completeRest('geral');}
      saveGeneral();renderGeneral();
    }
    if(gap.running){
      if(!gap.el?.isConnected){gap.running=false;cancelPush('series');}
      else {
        gap.remaining=Math.max(0,Math.ceil((gap.deadline-Date.now())/1000));
        if(gap.remaining===0){gap.running=false;gap.paused=false;gap.deadline=0;gap.remaining=gap.duration;completeRest('series');}
        renderGap();
      }
    }
    if(!general.running&&!gap.running&&ticker){clearInterval(ticker);ticker=null;}
  }
  function startTicker(){if(!ticker)ticker=setInterval(tick,220);}
  function pauseGeneral(){
    if(general.running){general.remaining=Math.max(0,Math.ceil((general.deadline-Date.now())/1000));general.running=false;general.paused=true;general.deadline=0;cancelPush('geral');}
    saveGeneral();renderGeneral();
  }
  function startGeneral(seriesSeconds){
    ensureAudio();
    if(general.running){pauseGeneral();return;}
    if(validSeconds(seriesSeconds)){general.duration=seriesSeconds;general.remaining=seriesSeconds;}
    if(general.remaining<=0)general.remaining=general.duration;
    general.deadline=Date.now()+general.remaining*1000;
    general.running=true;general.paused=false;saveGeneral();renderGeneral();startTicker();
    schedulePush('geral',general.deadline);
  }
  function resetGeneral(){
    pauseGeneral();general.paused=false;general.duration=defaultSeconds;general.remaining=defaultSeconds;general.deadline=0;
    cancelPush('geral');saveGeneral();renderGeneral();
  }
  function selectGap(element){
    if(gap.el===element)return;
    if(gap.running)cancelPush('series');
    setPlayButton(gap.el?.querySelector('.gym-inline-rest-toggle'),false,'Iniciar');
    gap.el=element;gap.running=false;gap.paused=false;gap.deadline=0;
    const saved=Number(element.dataset.restSeconds);
    gap.duration=validSeconds(saved)?saved:defaultSeconds;
    gap.remaining=gap.duration;renderGap();
  }
  function toggleGap(element){
    ensureAudio();selectGap(element);
    if(gap.running){gap.remaining=Math.max(0,Math.ceil((gap.deadline-Date.now())/1000));gap.running=false;gap.paused=true;gap.deadline=0;cancelPush('series');}
    else {
      if(gap.remaining<=0)gap.remaining=gap.duration;
      gap.running=true;gap.paused=false;gap.deadline=Date.now()+gap.remaining*1000;
      schedulePush('series',gap.deadline);startTicker();
    }
    renderGap();
  }
  function applyDurationToGap(node,seconds,isOverride){
    if(!node || !validSeconds(seconds))return;
    node.dataset.restSeconds=String(seconds);
    node.dataset.restOverride=isOverride?'true':'false';
    syncSlot(node.querySelector('.gym-rest-row'),seconds);
    const c=node.querySelector('.gym-inline-rest-clock');if(c)c.textContent=fmt(seconds);
    const fill=node.querySelector('.gym-inline-rest-fill');if(fill)fill.style.width='100%';
    if(gap.el===node){
      if(gap.running)cancelPush('series');
      gap.duration=seconds;gap.remaining=seconds;gap.running=false;gap.paused=false;gap.deadline=0;renderGap();
    }
  }
  function applyDefaultToGaps(){
    document.querySelectorAll('.gym-inline-rest').forEach(node=>{
      // Não apagar um tempo individual personalizado ao alterar o padrão do treino.
      if(node.dataset.restOverride!=='true')applyDurationToGap(node,defaultSeconds,false);
    });
  }
  function setDefault(value){
    if(!validSeconds(value))return;
    defaultSeconds=value;storage(REST_DEFAULT_KEY,value);
    resetGeneral();general.duration=value;general.remaining=value;
    saveGeneral();renderGeneral();
    syncSlot(getGlobal('gymGeneralRest')?.querySelector('.gym-rest-row'),value);
    applyDefaultToGaps();
  }
  function initializeGaps(root=document){
    const nodes=[];
    if(root.matches?.('.gym-inline-rest'))nodes.push(root);
    root.querySelectorAll?.('.gym-inline-rest').forEach(node=>nodes.push(node));
    nodes.forEach(node=>{
      if(node.hasAttribute('data-rest-initialized'))return;
      node.setAttribute('data-rest-initialized','true');
      const saved=Number(node.dataset.restSaved);
      if(validSeconds(saved))applyDurationToGap(node,saved,true);
      else applyDurationToGap(node,defaultSeconds,false);
      setPlayButton(node.querySelector('.gym-inline-rest-toggle'),false,'Iniciar');
    });
  }

  // Qualquer toque prepara o áudio: um descanso retomado ao reabrir a app não passa por Iniciar.
  document.addEventListener('touchend',ensureAudio,{passive:true});
  document.addEventListener('click',event=>{
    ensureAudio();
    if(event.target.closest('#gymGeneralStart')){startGeneral(null);return;}
    if(event.target.closest('#gymGeneralReset')){resetGeneral();return;}
    if(event.target.closest('#gymRestCompleteDismiss')){
      ++toastToken;clearTimeout(toastTimer);getGlobal('gymRestCompleteToast').hidden=true;return;
    }
    const t=event.target.closest('.gym-inline-rest-toggle,.gym-inline-rest-reset');
    if(t){const element=t.closest('.gym-inline-rest');if(!element)return;
      if(t.matches('.gym-inline-rest-reset')){
        selectGap(element);if(gap.running){gap.running=false;cancelPush('series');}
        gap.deadline=0;gap.paused=false;gap.remaining=gap.duration;renderGap();
      } else toggleGap(element);
      return;
    }
    // Ao concluir uma série já guardada, iniciar o descanso padrão do treino.
    // A escolha do peso ou das repetições não aciona qualquer relógio.
    const series=event.target.closest('.gym-series-complete');
    if(series){
      if(performance.now()-(window.__treinoGuardadoEm||-1000)<450)return;
      const wasDone=series.getAttribute('aria-pressed')==='true';
      series.setAttribute('aria-pressed',String(!wasDone));
      window.marcarSerie?.(series.dataset.serieChave,!wasDone);
      // Só arranca com o timer parado: outro check não pode reiniciar um descanso a contar ou em pausa.
      if(!wasDone){if(!general.running&&!general.paused)startGeneral(Number(series.dataset.descanso));showEncouragement(series);}
    }
    const opcaoCorpo=event.target.closest('[data-corpo]');
    if(opcaoCorpo){corpo=opcaoCorpo.dataset.corpo;storage(BODY_KEY,corpo);renderProgress();}
    if(event.target.closest('[data-page="progress"]'))setTimeout(renderProgress,0);
  });
  const rowSeconds=row=>row.closest('#gymGeneralRest')?defaultSeconds:(Number(row.closest('.gym-inline-rest')?.dataset.restSeconds)||defaultSeconds);
  function applySeconds(row,seconds){
    const node=row.closest('.gym-inline-rest');
    if(row.closest('#gymGeneralRest'))setDefault(seconds);
    else if(node)applyDurationToGap(node,seconds,true);
  }
  const syncAllSlots=()=>document.querySelectorAll('.gym-rest-row').forEach(row=>syncSlot(row,rowSeconds(row)));
  function removeCustomTime(seconds){
    customTimes=customTimes.filter(v=>v!==seconds);storage(CUSTOM_TIMES_KEY,customTimes);
    if(defaultSeconds===seconds)setDefault(90);
    document.querySelectorAll('.gym-inline-rest').forEach(node=>{
      if(Number(node.dataset.restSeconds)===seconds)applyDurationToGap(node,defaultSeconds,false);
    });
    syncAllSlots();
  }
  const WHEEL_ROW=44;
  const wheelHtml=(label,max)=>`<div class="gym-wheel" role="spinbutton" tabindex="0" aria-label="${label}" aria-valuemin="0" aria-valuemax="${max}"><ul>${Array.from({length:max+1},(_,i)=>`<li>${String(i).padStart(2,'0')}</li>`).join('')}</ul></div>`;
  // Roda de minutos e segundos: arrasta-se com o dedo e encaixa em cada valor (scroll-snap).
  function chooseCustomTime(row){
    const previous=rowSeconds(row),origin=document.activeElement;
    const overlay=document.createElement('div');
    overlay.className='vf-dialog-overlay';
    overlay.innerHTML=`<div class="vf-dialog gym-wheel-dialog" role="dialog" aria-modal="true" aria-labelledby="gymWheelTitle">
      <h2 id="gymWheelTitle" class="vf-dialog-title">Escolhe o tempo</h2>
      <div class="gym-wheel-pair">${wheelHtml('Minutos',MAX_SECONDS_MINUTES)}<span aria-hidden="true">:</span>${wheelHtml('Segundos',59)}</div>
      <p class="gym-wheel-note" role="status"></p>
      <div class="vf-dialog-actions"><button type="button" class="vf-dialog-cancel">Cancelar</button><button type="button" class="vf-dialog-confirm">Guardar</button></div>
    </div>`;
    document.body.appendChild(overlay);
    const [minutes,secondsWheel]=overlay.querySelectorAll('.gym-wheel');
    const confirm=overlay.querySelector('.vf-dialog-confirm'),note=overlay.querySelector('.gym-wheel-note');
    const wheelValue=wheel=>Math.round(wheel.scrollTop/WHEEL_ROW);
    const total=()=>wheelValue(minutes)*60+wheelValue(secondsWheel);
    const refresh=()=>{
      const value=total(),repeated=choices.includes(value)||customTimes.includes(value);
      [minutes,secondsWheel].forEach(wheel=>{
        wheel.setAttribute('aria-valuenow',wheelValue(wheel));
        wheel.querySelectorAll('li').forEach((li,i)=>li.classList.toggle('is-selected',i===wheelValue(wheel)));
      });
      confirm.disabled=!validSeconds(value)||repeated;
      note.textContent=value<MIN_SECONDS?'Escolhe pelo menos 1 segundo.':value>MAX_SECONDS?'O máximo é 60:00.':repeated?`O tempo ${fmt(value)} já existe.`:'';
    };
    const close=()=>{
      document.removeEventListener('keydown',keys,true);
      overlay.classList.remove('open');
      setTimeout(()=>overlay.remove(),160);
      syncSlot(row,rowSeconds(row));
      if(origin?.isConnected)origin.focus({preventScroll:true});
    };
    const keys=event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
      else if((event.key==='ArrowUp'||event.key==='ArrowDown')&&event.target.matches('.gym-wheel')){
        event.preventDefault();
        event.target.scrollTop+=(event.key==='ArrowUp'?-1:1)*WHEEL_ROW;
      }
    };
    document.addEventListener('keydown',keys,true);
    [minutes,secondsWheel].forEach(wheel=>{
      wheel.addEventListener('scroll',refresh,{passive:true});
      wheel.addEventListener('click',event=>{
        const li=event.target.closest('li');
        if(li)wheel.scrollTo({top:[...li.parentElement.children].indexOf(li)*WHEEL_ROW,behavior:'smooth'});
      });
    });
    overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
    overlay.querySelector('.vf-dialog-cancel').addEventListener('click',close);
    confirm.addEventListener('click',()=>{
      const value=total();
      if(!validSeconds(value)||choices.includes(value)||customTimes.includes(value))return;
      customTimes.push(value);storage(CUSTOM_TIMES_KEY,customTimes);
      applySeconds(row,value);
      syncAllSlots();
      close();
    });
    minutes.scrollTop=Math.floor(previous/60)*WHEEL_ROW;
    secondsWheel.scrollTop=(previous%60)*WHEEL_ROW;
    refresh();
    requestAnimationFrame(()=>overlay.classList.add('open'));
    minutes.focus({preventScroll:true});
  }
  document.addEventListener('change',event=>{
    if(!event.target.matches('.gym-rest-select'))return;
    const row=event.target.closest('.gym-rest-row');
    if(event.target.value==='custom')chooseCustomTime(row);
    else applySeconds(row,Number(event.target.value));
  });
  document.addEventListener('vf-option-remove',event=>{
    if(event.target.matches('.gym-rest-select'))removeCustomTime(Number(event.detail));
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')tick();
  });
  const init=()=>{
    // Normalizar a duração restaurada, sem alterar o valor geral guardado.
    if(general.duration!==defaultSeconds&&!general.running&&!general.paused){general.duration=defaultSeconds;general.remaining=defaultSeconds;}
    saveGeneral();
    renderGeneral();initializeGaps();renderProgress();
    syncSlot(getGlobal('gymGeneralRest')?.querySelector('.gym-rest-row'),defaultSeconds);
    const observer=new MutationObserver(entries=>{
      entries.forEach(entry=>entry.addedNodes.forEach(node=>{
        if(node.nodeType===1)initializeGaps(node);
      }));
    });
    observer.observe(document.body,{childList:true,subtree:true});
    if(general.running){startTicker();tick();}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.regioesDoExercicio=regionsFor;
})();
